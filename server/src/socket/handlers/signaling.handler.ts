import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Track active calls: callId -> { callerId, targetId, status }
const activeCalls = new Map<string, { callerId: string; targetId: string; status: 'ringing' | 'active' }>();

export function signalingHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  // --- WebRTC Signaling for peer connections ---
  socket.on('rtc:offer', ({ targetUserId, offer, channelId }: { targetUserId: string; offer: any; channelId?: string }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit('rtc:offer', { userId, username, offer, channelId });
    });
  });

  socket.on('rtc:answer', ({ targetUserId, answer, channelId }: { targetUserId: string; answer: any; channelId?: string }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit('rtc:answer', { userId, answer, channelId });
    });
  });

  socket.on('rtc:ice-candidate', ({ targetUserId, candidate, channelId }: { targetUserId: string; candidate: any; channelId?: string }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit('rtc:ice-candidate', { userId, candidate, channelId });
    });
  });

  // --- 1-on-1 Call signaling ---
  socket.on('call:initiate', ({ targetUserId, type }: { targetUserId: string; type: 'audio' | 'video' }) => {
    const callId = uuidv4();
    activeCalls.set(callId, { callerId: userId, targetId: targetUserId, status: 'ringing' });

    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit('call:incoming', { callId, callerId: userId, callerName: username, type });
    });

    socket.emit('call:ringing', { callId });
  });

  socket.on('call:accept', ({ callId }: { callId: string }) => {
    const call = activeCalls.get(callId);
    if (!call || call.targetId !== userId) return;

    call.status = 'active';
    const callerSockets = getSocketsForUser(io, call.callerId);
    callerSockets.forEach((s) => {
      s.emit('call:accepted', { callId });
    });
    socket.emit('call:accepted', { callId });
  });

  socket.on('call:reject', ({ callId }: { callId: string }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);
    const callerSockets = getSocketsForUser(io, call.callerId);
    callerSockets.forEach((s) => {
      s.emit('call:rejected', { callId });
    });
  });

  socket.on('call:end', ({ callId }: { callId: string }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);
    const otherUserId = call.callerId === userId ? call.targetId : call.callerId;
    const otherSockets = getSocketsForUser(io, otherUserId);
    otherSockets.forEach((s) => {
      s.emit('call:ended', { callId });
    });
  });

  socket.on('disconnect', () => {
    // End all active calls for this user
    for (const [callId, call] of activeCalls) {
      if (call.callerId === userId || call.targetId === userId) {
        const otherUserId = call.callerId === userId ? call.targetId : call.callerId;
        const otherSockets = getSocketsForUser(io, otherUserId);
        otherSockets.forEach((s) => {
          s.emit('call:ended', { callId });
        });
        activeCalls.delete(callId);
      }
    }
  });
}

function getSocketsForUser(io: Server, userId: string): Socket[] {
  const sockets: Socket[] = [];
  for (const [, socket] of io.sockets.sockets) {
    if (socket.data.userId === userId) {
      sockets.push(socket);
    }
  }
  return sockets;
}
