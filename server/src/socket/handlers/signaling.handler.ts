import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { getSocketsForUser } from '../index';
import { EVENTS } from '../events';
import { validateSocket, rtcOfferSchema, rtcAnswerSchema, rtcIceCandidateSchema, callInitiateSchema, callIdSchema } from '../validation';

// Track active calls: callId -> { callerId, targetId, status }
const activeCalls = new Map<string, { callerId: string; targetId: string; status: 'ringing' | 'active' }>();

export function signalingHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  // --- WebRTC Signaling for peer connections ---
  socket.on(EVENTS.RTC_OFFER, validateSocket(rtcOfferSchema, socket, ({ targetUserId, offer, channelId }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit(EVENTS.RTC_OFFER, { userId, username, offer, channelId });
    });
  }));

  socket.on(EVENTS.RTC_ANSWER, validateSocket(rtcAnswerSchema, socket, ({ targetUserId, answer, channelId }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit(EVENTS.RTC_ANSWER, { userId, answer, channelId });
    });
  }));

  socket.on(EVENTS.RTC_ICE_CANDIDATE, validateSocket(rtcIceCandidateSchema, socket, ({ targetUserId, candidate, channelId }) => {
    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit(EVENTS.RTC_ICE_CANDIDATE, { userId, candidate, channelId });
    });
  }));

  // --- 1-on-1 Call signaling ---
  socket.on(EVENTS.CALL_INITIATE, validateSocket(callInitiateSchema, socket, ({ targetUserId, type }) => {
    const callId = uuidv4();
    activeCalls.set(callId, { callerId: userId, targetId: targetUserId, status: 'ringing' });

    const targetSockets = getSocketsForUser(io, targetUserId);
    targetSockets.forEach((s) => {
      s.emit(EVENTS.CALL_INCOMING, { callId, callerId: userId, callerName: username, type });
    });

    socket.emit(EVENTS.CALL_RINGING, { callId });
  }));

  socket.on(EVENTS.CALL_ACCEPT, validateSocket(callIdSchema, socket, ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.targetId !== userId) return;

    call.status = 'active';
    const callerSockets = getSocketsForUser(io, call.callerId);
    callerSockets.forEach((s) => {
      s.emit(EVENTS.CALL_ACCEPTED, { callId });
    });
    socket.emit(EVENTS.CALL_ACCEPTED, { callId });
  }));

  socket.on(EVENTS.CALL_REJECT, validateSocket(callIdSchema, socket, ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);
    const callerSockets = getSocketsForUser(io, call.callerId);
    callerSockets.forEach((s) => {
      s.emit(EVENTS.CALL_REJECTED, { callId });
    });
  }));

  socket.on(EVENTS.CALL_END, validateSocket(callIdSchema, socket, ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);
    const otherUserId = call.callerId === userId ? call.targetId : call.callerId;
    const otherSockets = getSocketsForUser(io, otherUserId);
    otherSockets.forEach((s) => {
      s.emit(EVENTS.CALL_ENDED, { callId });
    });
  }));

  socket.on('disconnect', () => {
    // End all active calls for this user
    for (const [callId, call] of activeCalls) {
      if (call.callerId === userId || call.targetId === userId) {
        const otherUserId = call.callerId === userId ? call.targetId : call.callerId;
        const otherSockets = getSocketsForUser(io, otherUserId);
        otherSockets.forEach((s) => {
          s.emit(EVENTS.CALL_ENDED, { callId });
        });
        activeCalls.delete(callId);
      }
    }
  });
}
