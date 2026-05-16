const prisma = require('../utils/prisma');
const { emitNotification } = require('../utils/socket');

const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ error: 'ProductId y rating son requeridos' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'El rating debe ser entre 1 y 5' });

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    if (product.sellerId === req.user.id) {
      return res.status(400).json({ error: 'No puedes reseñar tu propio producto' });
    }

    // Check if user has bought this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: parseInt(productId),
        order: { buyerId: req.user.id, status: { in: ['CONFIRMED', 'DELIVERED'] } },
      },
    });
    if (!hasPurchased) {
      return res.status(403).json({ error: 'Solo puedes reseñar productos que hayas comprado' });
    }

    const existing = await prisma.review.findUnique({
      where: { reviewerId_productId: { reviewerId: req.user.id, productId: parseInt(productId) } },
    });
    if (existing) return res.status(400).json({ error: 'Ya dejaste una reseña para este producto' });

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        reviewerId: req.user.id,
        sellerId: product.sellerId,
        productId: parseInt(productId),
      },
      include: { reviewer: { select: { id: true, name: true, photo: true } } },
    });

    // Notify seller
    const notification = await prisma.notification.create({
      data: {
        userId: product.sellerId,
        type: 'NEW_REVIEW',
        message: `${req.user.name} dejó una reseña de ${rating}⭐`,
        link: `/profile/${product.sellerId}`,
      },
    });
    emitNotification(req.io, product.sellerId, notification);

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear reseña' });
  }
};

const getSellerReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { sellerId: parseInt(req.params.sellerId) },
      include: {
        reviewer: { select: { id: true, name: true, photo: true } },
        product: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avg: Math.round(avg * 10) / 10, total: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
};

module.exports = { createReview, getSellerReviews };
