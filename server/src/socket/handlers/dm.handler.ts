import { Server, Socket } from 'socket.io';
import prisma from '../../config/database';
import * as dmService from '../../services/dm.service';
import { EVENTS } from '../events';
import { validateSocket, conversationIdSchema, dmPayloadSchema } from '../validation';

export function dmHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on(EVENTS.DM_JOIN, validateSocket(conversationIdSchema, socket, async ({ conversationId }) => {
    // Verify participation before joining room
    const participant = await prisma.dMParticipant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) {
      socket.emit(EVENTS.ERROR, { message: 'Not a participant of this conversation' });
      return;
    }
    socket.join(`dm:${conversationId}`);
  }));

  socket.on(EVENTS.DM_LEAVE, validateSocket(conversationIdSchema, socket, ({ conversationId }) => {
    socket.leave(`dm:${conversationId}`);
  }));

  socket.on(EVENTS.DM_SEND, validateSocket(dmPayloadSchema, socket, async ({ conversationId, content }) => {
    const message = await dmService.createDM(conversationId, userId, content);
    io.to(`dm:${conversationId}`).emit(EVENTS.DM_NEW, { message, conversationId });
  }));

  socket.on(EVENTS.DM_TYPING, validateSocket(conversationIdSchema, socket, ({ conversationId }) => {
    socket.to(`dm:${conversationId}`).emit(EVENTS.DM_TYPING_UPDATE, {
      conversationId,
      userId,
    });
  }));
}
