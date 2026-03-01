import { Server, Socket } from 'socket.io';
import * as dmService from '../../services/dm.service';

export function dmHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on('dm:join', ({ conversationId }: { conversationId: string }) => {
    socket.join(`dm:${conversationId}`);
  });

  socket.on('dm:leave', ({ conversationId }: { conversationId: string }) => {
    socket.leave(`dm:${conversationId}`);
  });

  socket.on('dm:send', async ({ conversationId, content }: { conversationId: string; content: string }) => {
    try {
      const message = await dmService.createDM(conversationId, userId, content);
      io.to(`dm:${conversationId}`).emit('dm:new', { message, conversationId });
    } catch (err) {
      socket.emit('error', { message: 'Failed to send DM' });
    }
  });

  socket.on('dm:typing', ({ conversationId }: { conversationId: string }) => {
    socket.to(`dm:${conversationId}`).emit('dm:typing-update', {
      conversationId,
      userId,
    });
  });
}
