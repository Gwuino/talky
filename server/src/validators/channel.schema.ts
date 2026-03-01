import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers and hyphens'),
  type: z.enum(['TEXT', 'VOICE']),
});

export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  position: z.number().int().min(0).optional(),
});
