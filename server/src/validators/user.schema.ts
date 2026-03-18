import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  avatarUrl: z.string().url().max(512).optional().nullable(),
});
