import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as friendService from '../services/friend.service';
import { getIO, onlineUsers } from '../socket/index';

function emitToUser(userId: string, event: string, data: any) {
  const io = getIO();
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.forEach((socketId) => io.to(socketId).emit(event, data));
  }
}

export async function sendRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friendship = await friendService.sendRequest(req.userId!, req.body.targetUserId);
    emitToUser(req.body.targetUserId, 'friend:request-received', friendship);
    res.status(201).json(friendship);
  } catch (err) { next(err); }
}

export async function acceptRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friendship = await friendService.acceptRequest(req.params.friendshipId, req.userId!);
    emitToUser(friendship.senderId, 'friend:request-accepted', friendship);
    res.json(friendship);
  } catch (err) { next(err); }
}

export async function declineRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friendship = await friendService.declineRequest(req.params.friendshipId, req.userId!);
    res.json(friendship);
  } catch (err) { next(err); }
}

export async function removeFriend(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friendship = await friendService.removeFriend(req.params.friendshipId, req.userId!);
    const otherId = friendship.senderId === req.userId! ? friendship.receiverId : friendship.senderId;
    emitToUser(otherId, 'friend:removed', { friendshipId: friendship.id, userId: req.userId });
    res.json(friendship);
  } catch (err) { next(err); }
}

export async function blockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friendship = await friendService.blockUser(req.userId!, req.params.userId);
    emitToUser(req.params.userId, 'friend:removed', { friendshipId: friendship.id, userId: req.userId });
    res.json(friendship);
  } catch (err) { next(err); }
}

export async function getFriends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friends = await friendService.getFriends(req.userId!);
    res.json(friends);
  } catch (err) { next(err); }
}

export async function getPendingRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requests = await friendService.getPendingRequests(req.userId!);
    res.json(requests);
  } catch (err) { next(err); }
}
