const prisma = require('../utils/prisma');

const getOrCreateConversation = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    const buyerId = req.user.id;

    if (buyerId === parseInt(sellerId)) {
      return res.status(400).json({ error: 'No puedes chatear contigo mismo' });
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        productId: parseInt(productId),
        participants: {
          every: { userId: { in: [buyerId, parseInt(sellerId)] } },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, photo: true } } } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true } } } },
        product: { select: { id: true, title: true, images: true, price: true } },
      },
    });

    if (existing) return res.json(existing);

    const conversation = await prisma.conversation.create({
      data: {
        productId: parseInt(productId),
        participants: {
          create: [{ userId: buyerId }, { userId: parseInt(sellerId) }],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, photo: true } } } },
        messages: true,
        product: { select: { id: true, title: true, images: true, price: true } },
      },
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener conversación' });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, photo: true } } } },
        product: { select: { id: true, title: true, images: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const convId = parseInt(req.params.id);
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: convId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'No tienes acceso a esta conversación' });

    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      include: { sender: { select: { id: true, name: true, photo: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: { conversationId: convId, senderId: { not: req.user.id }, read: false },
      data: { read: true },
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

module.exports = { getOrCreateConversation, getMyConversations, getConversationMessages };
