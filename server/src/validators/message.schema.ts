import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
