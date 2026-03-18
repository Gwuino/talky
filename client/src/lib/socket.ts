import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

// Track rooms to rejoin on reconnect
const activeRooms = new Set<{ event: string; data: Record<string, string> }>();

export function getSocket(): Socket | null {
  return socket;
}

export function trackRoom(event: string, data: Record<string, string>) {
  activeRooms.add({ event, data });
}

export function untrackRoom(event: string, key: string, value: string) {
  for (const room of activeRooms) {
    if (room.event === event && room.data[key] === value) {
      activeRooms.delete(room);
      break;
    }
  }
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    // Re-subscribe to all tracked rooms on reconnect
    if (activeRooms.size > 0) {
      activeRooms.forEach((room) => {
        socket?.emit(room.event, room.data);
      });
    }
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
    console.log('Socket disconnected:', reason);
  });

  socket.on('reconnect', (attemptNumber: number) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    toast.success('Reconnected', { id: 'reconnect' });
  });

  socket.on('reconnect_attempt', (attemptNumber: number) => {
    if (attemptNumber === 1) {
      toast.loading('Reconnecting...', { id: 'reconnect' });
    }
  });

  socket.on('reconnect_failed', () => {
    toast.error('Connection lost. Please refresh the page.', { id: 'reconnect' });
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeRooms.clear();
}
