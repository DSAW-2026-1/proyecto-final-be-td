const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

const connectedUsers = new Map(); // userId -> socketId

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('send_message', async (data) => {
      const { conversationId, content } = data;
      try {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: { conversationId: parseInt(conversationId), userId },
          },
        });
        if (!participant) return;

        const message = await prisma.message.create({
          data: {
            content,
            conversationId: parseInt(conversationId),
            senderId: userId,
          },
          include: { sender: { select: { id: true, name: true, photo: true } } },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: parseInt(conversationId) },
          data: { updatedAt: new Date() },
        });

        // Emit to all in the conversation room
        io.to(`conv:${conversationId}`).emit('new_message', message);

        // Notify the other participant
        const conversation = await prisma.conversation.findUnique({
          where: { id: parseInt(conversationId) },
          include: { participants: true },
        });

        const otherParticipant = conversation.participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          const notification = await prisma.notification.create({
            data: {
              userId: otherParticipant.userId,
              type: 'NEW_MESSAGE',
              message: `Nuevo mensaje de ${message.sender.name}`,
              link: `/chat/${conversationId}`,
            },
          });
          io.to(`user:${otherParticipant.userId}`).emit('new_notification', notification);
        }
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });
}

function emitNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('new_notification', notification);
}

module.exports = { setupSocket, emitNotification, connectedUsers };
