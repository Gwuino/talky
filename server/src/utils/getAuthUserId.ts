import { AuthRequest } from '../middleware/auth';
import { UnauthorizedError } from './errors';

export function getAuthUserId(req: AuthRequest): string {
  if (!req.userId) throw new UnauthorizedError('Authentication required');
  return req.userId;
}
