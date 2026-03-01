import { z } from 'zod';

export const createServerSchema = z.object({
  name: z.string().min(1, 'Server name is required').max(100),
});

export const updateServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  iconUrl: z.string().url().optional().nullable(),
});

export const joinServerSchema = z.object({
  inviteCode: z.string().uuid('Invalid invite code'),
});
