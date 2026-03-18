import { z } from 'zod';

export const createConversationSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
});

export const sendDMSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});
