import { Server, Socket } from 'socket.io';
import * as messageService from '../../services/message.service';

export function chatHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on('channel:join', ({ channelId }: { channelId: string }) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', ({ channelId }: { channelId: string }) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('message:send', async ({ channelId, content }: { channelId: string; content: string }) => {
    try {
      const message = await messageService.createMessage(channelId, userId, content);
      io.to(`channel:${channelId}`).emit('message:new', message);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing:start', ({ channelId }: { channelId: string }) => {
    socket.to(`channel:${channelId}`).emit('typing:update', {
      channelId,
      userId,
      username: socket.data.username,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ channelId }: { channelId: string }) => {
    socket.to(`channel:${channelId}`).emit('typing:update', {
      channelId,
      userId,
      username: socket.data.username,
      isTyping: false,
    });
  });
}
