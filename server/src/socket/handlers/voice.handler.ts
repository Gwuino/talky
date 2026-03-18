import { Server, Socket } from 'socket.io';
import prisma from '../../config/database';
import { EVENTS } from '../events';
import { validateSocket, channelIdSchema, voiceMuteSchema, voiceDeafenSchema } from '../validation';

// Track voice channel participants: channelId -> Map<userId, { socketId, username, muted, deafened }>
export const voiceChannels = new Map<string, Map<string, { socketId: string; username: string; muted: boolean; deafened: boolean }>>();
// Track channelId -> serverId for broadcasting to server rooms
const channelServerMap = new Map<string, string>();

// Helper: build participant list for a channel and broadcast to server room
function broadcastChannelUsers(io: Server, channelId: string) {
  const serverId = channelServerMap.get(channelId);
  if (!serverId) return;
  const participants = voiceChannels.get(channelId);
  const users = participants
    ? Array.from(participants.entries()).map(([uid, state]) => ({ userId: uid, username: state.username }))
    : [];
  io.to(`server:${serverId}`).emit('voice:channel-update', { channelId, users });
}

export function voiceHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  socket.on(EVENTS.VOICE_JOIN, validateSocket(channelIdSchema, socket, async ({ channelId }) => {
    // Verify membership before joining voice channel
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return;

    // Cache channelId -> serverId mapping
    if (!channelServerMap.has(channelId)) {
      channelServerMap.set(channelId, channel.serverId);
    }

    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId: channel.serverId } },
    });
    if (!member) {
      socket.emit(EVENTS.ERROR, { message: 'Not a member of this server' });
      return;
    }

    // Leave any existing voice channel
    for (const [chId, participants] of voiceChannels) {
      if (participants.has(userId)) {
        participants.delete(userId);
        socket.leave(`voice:${chId}`);
        io.to(`voice:${chId}`).emit(EVENTS.VOICE_USER_LEFT, { channelId: chId, userId });
        if (participants.size === 0) voiceChannels.delete(chId);
        broadcastChannelUsers(io, chId);
      }
    }

    // Join new voice channel
    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }
    voiceChannels.get(channelId)!.set(userId, {
      socketId: socket.id,
      username,
      muted: false,
      deafened: false,
    });
    socket.join(`voice:${channelId}`);

    // Send existing participants to the new user
    const participants = Array.from(voiceChannels.get(channelId)!.entries())
      .filter(([uid]) => uid !== userId)
      .map(([uid, state]) => ({ userId: uid, username: state.username, socketId: state.socketId, muted: state.muted, deafened: state.deafened }));
    socket.emit(EVENTS.VOICE_PARTICIPANTS, { channelId, participants });

    // Notify others in the voice room
    socket.to(`voice:${channelId}`).emit(EVENTS.VOICE_USER_JOINED, {
      channelId,
      userId,
      username,
    });

    // Broadcast updated participant list to the server room (for sidebar)
    broadcastChannelUsers(io, channelId);
  }));

  // Return current voice users for a list of channels (for sidebar initial load)
  socket.on('voice:get-channel-users', ({ channelIds }: { channelIds: string[] }, callback?: (data: Record<string, { userId: string; username: string }[]>) => void) => {
    const result: Record<string, { userId: string; username: string }[]> = {};
    for (const chId of channelIds) {
      const participants = voiceChannels.get(chId);
      if (participants && participants.size > 0) {
        result[chId] = Array.from(participants.entries()).map(([uid, state]) => ({ userId: uid, username: state.username }));
      }
    }
    if (callback) callback(result);
  });

  socket.on(EVENTS.VOICE_LEAVE, validateSocket(channelIdSchema, socket, ({ channelId }) => {
    leaveVoice(io, socket, channelId, userId);
  }));

  socket.on(EVENTS.VOICE_MUTE, validateSocket(voiceMuteSchema, socket, ({ channelId, muted }) => {
    const participants = voiceChannels.get(channelId);
    if (participants?.has(userId)) {
      const state = participants.get(userId)!;
      state.muted = muted;
      io.to(`voice:${channelId}`).emit(EVENTS.VOICE_STATE_UPDATE, {
        channelId,
        userId,
        muted: state.muted,
        deafened: state.deafened,
      });
    }
  }));

  socket.on(EVENTS.VOICE_DEAFEN, validateSocket(voiceDeafenSchema, socket, ({ channelId, deafened }) => {
    const participants = voiceChannels.get(channelId);
    if (participants?.has(userId)) {
      const state = participants.get(userId)!;
      state.deafened = deafened;
      if (deafened) state.muted = true;
      io.to(`voice:${channelId}`).emit(EVENTS.VOICE_STATE_UPDATE, {
        channelId,
        userId,
        muted: state.muted,
        deafened: state.deafened,
      });
    }
  }));

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
    io.to(`voice:${channelId}`).emit(EVENTS.VOICE_USER_LEFT, { channelId, userId });
    if (participants.size === 0) voiceChannels.delete(channelId);
    broadcastChannelUsers(io, channelId);
  }
}
