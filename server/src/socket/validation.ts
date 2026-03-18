import { z } from 'zod';
import { Socket } from 'socket.io';

// Reusable schemas for socket event payloads
export const channelIdSchema = z.object({
  channelId: z.string().uuid(),
});

export const conversationIdSchema = z.object({
  conversationId: z.string().uuid(),
});

export const serverIdSchema = z.object({
  serverId: z.string().uuid(),
});

export const messagePayloadSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const dmPayloadSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const voiceMuteSchema = z.object({
  channelId: z.string().uuid(),
  muted: z.boolean(),
});

export const voiceDeafenSchema = z.object({
  channelId: z.string().uuid(),
  deafened: z.boolean(),
});

export const rtcOfferSchema = z.object({
  targetUserId: z.string().uuid(),
  offer: z.object({
    type: z.string(),
    sdp: z.string().max(65536),
  }),
  channelId: z.string().uuid().optional(),
});

export const rtcAnswerSchema = z.object({
  targetUserId: z.string().uuid(),
  answer: z.object({
    type: z.string(),
    sdp: z.string().max(65536),
  }),
  channelId: z.string().uuid().optional(),
});

export const rtcIceCandidateSchema = z.object({
  targetUserId: z.string().uuid(),
  candidate: z.object({
    candidate: z.string().max(4096),
    sdpMid: z.string().max(256).nullable().optional(),
    sdpMLineIndex: z.number().int().nullable().optional(),
  }),
  channelId: z.string().uuid().optional(),
});

export const callInitiateSchema = z.object({
  targetUserId: z.string().uuid(),
  type: z.enum(['audio', 'video']),
});

export const callIdSchema = z.object({
  callId: z.string().uuid(),
});

/**
 * Validates socket event data and calls the handler if valid.
 * Emits an error event back to the socket if validation fails.
 */
export function validateSocket<T>(schema: z.ZodSchema<T>, socket: Socket, handler: (data: T) => void | Promise<void>) {
  return (rawData: unknown) => {
    const result = schema.safeParse(rawData);
    if (!result.success) {
      socket.emit('error', { message: 'Invalid payload', details: result.error.issues.map((i) => i.message) });
      return;
    }
    const maybePromise = handler(result.data);
    if (maybePromise instanceof Promise) {
      maybePromise.catch((err) => {
        console.error(`Socket handler error [${socket.data.username}]:`, err.message || err);
        socket.emit('error', { message: 'Internal error' });
      });
    }
  };
}
