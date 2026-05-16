const prisma = require('../utils/prisma');

const getProducts = async (req, res) => {
  try {
    const { category, condition, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, photo: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        seller: {
          select: {
            id: true, name: true, photo: true, career: true,
            reviewsReceived: { select: { rating: true } },
          },
        },
        reviews: {
          include: { reviewer: { select: { id: true, name: true, photo: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const avgRating = product.seller.reviewsReceived.length
      ? product.seller.reviewsReceived.reduce((a, r) => a + r.rating, 0) / product.seller.reviewsReceived.length
      : null;

    res.json({ ...product, seller: { ...product.seller, avgRating } });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, condition } = req.body;
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Auto-upgrade to seller
    if (req.user.role === 'BUYER') {
      await prisma.user.update({ where: { id: req.user.id }, data: { role: 'SELLER' } });
    }

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        condition: condition || 'USED',
        images,
        sellerId: req.user.id,
      },
      include: { seller: { select: { id: true, name: true, photo: true } } },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No puedes editar este producto' });
    }

    const { title, description, price, category, condition } = req.body;
    const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : undefined;

    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(condition && { condition }),
        ...(newImages && { images: newImages }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No puedes eliminar este producto' });
    }

    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      include: { _count: { select: { reviews: true, orderItems: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus productos' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts };
