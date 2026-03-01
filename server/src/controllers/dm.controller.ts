import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as dmService from '../services/dm.service';

export async function getConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversations = await dmService.getConversations(req.userId!);
    res.json(conversations);
  } catch (err) { next(err); }
}

export async function createConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversation = await dmService.getOrCreateConversation(req.userId!, req.body.targetUserId);
    res.json(conversation);
  } catch (err) { next(err); }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await dmService.getDMMessages(req.params.conversationId as string, req.userId!, cursor, limit);
    res.json(result);
  } catch (err) { next(err); }
}
