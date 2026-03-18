import { Server, Socket } from 'socket.io';
import prisma from '../../config/database';
import { onlineUsers } from '../index';
import { EVENTS } from '../events';
import { validateSocket, serverIdSchema } from '../validation';

export function presenceHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on(EVENTS.SERVER_JOIN_ROOM, validateSocket(serverIdSchema, socket, async ({ serverId }) => {
    // Verify membership before joining server room
    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });
    if (!member) {
      socket.emit(EVENTS.ERROR, { message: 'Not a member of this server' });
      return;
    }
    socket.join(`server:${serverId}`);

    // Send only online users who are members of this server (not all global users)
    const serverMembers = await prisma.serverMember.findMany({
      where: { serverId },
      select: { userId: true },
    });
    const memberIds = new Set(serverMembers.map((m) => m.userId));
    const onlineUserIds = Array.from(onlineUsers.keys()).filter((uid) => memberIds.has(uid));
    socket.emit(EVENTS.PRESENCE_ONLINE_USERS, { userIds: onlineUserIds });
  }));

  socket.on(EVENTS.SERVER_LEAVE_ROOM, validateSocket(serverIdSchema, socket, ({ serverId }) => {
    socket.leave(`server:${serverId}`);
  }));
}
