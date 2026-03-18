import { Server, Socket } from 'socket.io';
import prisma from '../../config/database';
import * as messageService from '../../services/message.service';
import { EVENTS } from '../events';
import { validateSocket, channelIdSchema, messagePayloadSchema } from '../validation';

export function chatHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on(EVENTS.CHANNEL_JOIN, validateSocket(channelIdSchema, socket, async ({ channelId }) => {
    // Verify membership before joining room
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return;
    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId: channel.serverId } },
    });
    if (!member) {
      socket.emit(EVENTS.ERROR, { message: 'Not a member of this server' });
      return;
    }
    socket.join(`channel:${channelId}`);
  }));

  socket.on(EVENTS.CHANNEL_LEAVE, validateSocket(channelIdSchema, socket, ({ channelId }) => {
    socket.leave(`channel:${channelId}`);
  }));

  socket.on(EVENTS.MESSAGE_SEND, validateSocket(messagePayloadSchema, socket, async ({ channelId, content }) => {
    const message = await messageService.createMessage(channelId, userId, content);
    io.to(`channel:${channelId}`).emit(EVENTS.MESSAGE_NEW, message);
  }));

  socket.on(EVENTS.TYPING_START, validateSocket(channelIdSchema, socket, ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit(EVENTS.TYPING_UPDATE, {
      channelId,
      userId,
      username: socket.data.username,
      isTyping: true,
    });
  }));

  socket.on(EVENTS.TYPING_STOP, validateSocket(channelIdSchema, socket, ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit(EVENTS.TYPING_UPDATE, {
      channelId,
      userId,
      username: socket.data.username,
      isTyping: false,
    });
  }));
}
