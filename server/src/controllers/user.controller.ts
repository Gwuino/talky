import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUser(req.params.userId as string);
  res.json(user);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.updateProfile(getAuthUserId(req), req.body);
  res.json(user);
});

export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.length < 1) {
    return res.json([]);
  }
  const users = await userService.searchUsers(query, getAuthUserId(req));
  res.json(users);
});
