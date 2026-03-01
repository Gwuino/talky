import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
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
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // Server forced disconnect, attempt reconnect
      socket?.connect();
    }
    console.log('Socket disconnected:', reason);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    toast.success('Reconnected');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
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
}
