const prisma = require('../utils/prisma');

// ── NOTIFICATIONS ──────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const markRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

// ── REPORTS ────────────────────────────────────────────────────
const createReport = async (req, res) => {
  try {
    const { type, reason, reportedUserId, productId } = req.body;
    const report = await prisma.report.create({
      data: {
        type,
        reason,
        reporterId: req.user.id,
        reportedUserId: reportedUserId ? parseInt(reportedUserId) : undefined,
        productId: productId ? parseInt(productId) : undefined,
      },
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear reporte' });
  }
};

// ── USERS ──────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, career: true, photo: true, role: true, createdAt: true,
        products: { where: { isActive: true }, take: 8 },
        reviewsReceived: {
          include: { reviewer: { select: { id: true, name: true, photo: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const avg = user.reviewsReceived.length
      ? user.reviewsReceived.reduce((a, r) => a + r.rating, 0) / user.reviewsReceived.length
      : null;

    res.json({ ...user, avgRating: avg ? Math.round(avg * 10) / 10 : null });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, career } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(career !== undefined && { career }),
        ...(photo && { photo }),
      },
      select: { id: true, name: true, career: true, photo: true, role: true, email: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// ── ADMIN ──────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [users, products, orders, reports, recentUsers, recentProducts] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 5, include: { seller: { select: { name: true } } } }),
    ]);
    res.json({ stats: { users, products, orders, pendingReports: reports }, recentUsers, recentProducts });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isSuspended: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const suspendUser = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isSuspended: req.body.suspend },
      select: { id: true, name: true, isSuspended: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al suspender usuario' });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true } },
        reportedUser: { select: { id: true, name: true } },
        product: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const report = await prisma.report.update({
      where: { id: parseInt(req.params.id) },
      data: { status: req.body.status },
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error al resolver reporte' });
  }
};

module.exports = {
  getNotifications, markRead,
  createReport,
  getProfile, updateProfile,
  getDashboard, getAllUsers, suspendUser, getReports, resolveReport,
};
