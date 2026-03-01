import { Server, Socket } from 'socket.io';

// Track voice channel participants: channelId -> Map<userId, { socketId, muted, deafened }>
export const voiceChannels = new Map<string, Map<string, { socketId: string; muted: boolean; deafened: boolean }>>();

export function voiceHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  socket.on('voice:join', ({ channelId }: { channelId: string }) => {
    // Leave any existing voice channel
    for (const [chId, participants] of voiceChannels) {
      if (participants.has(userId)) {
        participants.delete(userId);
        socket.leave(`voice:${chId}`);
        io.to(`voice:${chId}`).emit('voice:user-left', { channelId: chId, userId });
        if (participants.size === 0) voiceChannels.delete(chId);
      }
    }

    // Join new voice channel
    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }
    voiceChannels.get(channelId)!.set(userId, {
      socketId: socket.id,
      muted: false,
      deafened: false,
    });
    socket.join(`voice:${channelId}`);

    // Send existing participants to the new user
    const participants = Array.from(voiceChannels.get(channelId)!.entries())
      .filter(([uid]) => uid !== userId)
      .map(([uid, state]) => ({ userId: uid, ...state }));
    socket.emit('voice:participants', { channelId, participants });

    // Notify others
    socket.to(`voice:${channelId}`).emit('voice:user-joined', {
      channelId,
      userId,
      username,
    });
  });

  socket.on('voice:leave', ({ channelId }: { channelId: string }) => {
    leaveVoice(io, socket, channelId, userId);
  });

  socket.on('voice:mute', ({ channelId, muted }: { channelId: string; muted: boolean }) => {
    const participants = voiceChannels.get(channelId);
    if (participants?.has(userId)) {
      const state = participants.get(userId)!;
      state.muted = muted;
      io.to(`voice:${channelId}`).emit('voice:state-update', {
        channelId,
        userId,
        muted: state.muted,
        deafened: state.deafened,
      });
    }
  });

  socket.on('voice:deafen', ({ channelId, deafened }: { channelId: string; deafened: boolean }) => {
    const participants = voiceChannels.get(channelId);
    if (participants?.has(userId)) {
      const state = participants.get(userId)!;
      state.deafened = deafened;
      if (deafened) state.muted = true;
      io.to(`voice:${channelId}`).emit('voice:state-update', {
        channelId,
        userId,
        muted: state.muted,
        deafened: state.deafened,
      });
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const [channelId, participants] of voiceChannels) {
      if (participants.has(userId)) {
        leaveVoice(io, socket, channelId, userId);
      }
    }
  });
}

function leaveVoice(io: Server, socket: Socket, channelId: string, userId: string) {
  const participants = voiceChannels.get(channelId);
  if (participants) {
    participants.delete(userId);
    socket.leave(`voice:${channelId}`);
    io.to(`voice:${channelId}`).emit('voice:user-left', { channelId, userId });
    if (participants.size === 0) voiceChannels.delete(channelId);
  }
}
