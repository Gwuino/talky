import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';

export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUser(req.params.userId as string);
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch (err) { next(err); }
}

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 1) {
      return res.json([]);
    }
    const users = await userService.searchUsers(query, req.userId!);
    res.json(users);
  } catch (err) { next(err); }
}
