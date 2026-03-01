import { Server, Socket } from 'socket.io';
import { onlineUsers } from '../index';

export function presenceHandler(io: Server, socket: Socket) {
  socket.on('server:join-room', ({ serverId }: { serverId: string }) => {
    socket.join(`server:${serverId}`);

    // Send current online users list
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('presence:online-users', { userIds: onlineUserIds });
  });

  socket.on('server:leave-room', ({ serverId }: { serverId: string }) => {
    socket.leave(`server:${serverId}`);
  });
}
