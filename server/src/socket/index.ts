import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { env } from '../config/env';
import prisma from '../config/database';
import { chatHandler } from './handlers/chat.handler';
import { presenceHandler } from './handlers/presence.handler';
import { dmHandler } from './handlers/dm.handler';
import { voiceHandler } from './handlers/voice.handler';
import { signalingHandler } from './handlers/signaling.handler';

// Track online users: userId -> Set<socketId>
export const onlineUsers = new Map<string, Set<string>>();

// Exported io instance for use from services/controllers
let ioInstance: Server | null = null;
export function getIO(): Server {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  ioInstance = io;

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${socket.data.username} (${userId})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Update DB status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE' },
    }).catch(() => {});

    // Broadcast online status to all connected users
    socket.broadcast.emit('user:online', { userId, status: 'ONLINE' });

    // Register handlers
    chatHandler(io, socket);
    presenceHandler(io, socket);
    dmHandler(io, socket);
    voiceHandler(io, socket);
    signalingHandler(io, socket);

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.data.username}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'OFFLINE' },
          }).catch(() => {});
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  return io;
}
