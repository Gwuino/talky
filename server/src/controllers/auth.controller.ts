import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(getAuthUserId(req));
  res.json(user);
});
