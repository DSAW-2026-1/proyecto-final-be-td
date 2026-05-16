const prisma = require('../utils/prisma');
const { emitNotification } = require('../utils/socket');

const createOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    if (!items || !items.length) return res.status(400).json({ error: 'El carrito está vacío' });

    // Fetch products and validate
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'Uno o más productos no están disponibles' });
    }

    // Check buyer is not buying own product
    const ownProduct = products.find(p => p.sellerId === req.user.id);
    if (ownProduct) return res.status(400).json({ error: 'No puedes comprar tus propios productos' });

    const total = items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      return acc + product.price * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        total,
        items: {
          create: items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
      include: {
        items: { include: { product: true } },
        buyer: { select: { id: true, name: true } },
      },
    });

    // Notify sellers
    const sellerIds = [...new Set(products.map(p => p.sellerId))];
    for (const sellerId of sellerIds) {
      const notification = await prisma.notification.create({
        data: {
          userId: sellerId,
          type: 'NEW_ORDER',
          message: `${req.user.name} realizó una compra`,
          link: `/orders/${order.id}`,
        },
      });
      emitNotification(req.io, sellerId, notification);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      include: { items: { include: { product: { include: { seller: { select: { id: true, name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

const getSalesOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { items: { some: { product: { sellerId: req.user.id } } } },
      include: {
        items: { include: { product: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Only seller of items can update
    const isSeller = order.items.some(i => i.product.sellerId === req.user.id);
    if (!isSeller && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No puedes actualizar esta orden' });
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });

    // Notify buyer
    const notification = await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ORDER_STATUS',
        message: `Tu orden #${order.id} cambió a: ${status}`,
        link: `/orders/${order.id}`,
      },
    });
    emitNotification(req.io, order.buyerId, notification);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: { include: { product: { include: { seller: { select: { id: true, name: true } } } } } },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const isBuyer = order.buyerId === req.user.id;
    const isSeller = order.items.some(i => i.product.sellerId === req.user.id);
    if (!isBuyer && !isSeller && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes acceso a esta orden' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

module.exports = { createOrder, getMyOrders, getSalesOrders, updateOrderStatus, getOrder };
