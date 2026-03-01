import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as messageService from '../services/message.service';

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await messageService.getMessages(req.params.channelId as string, req.userId!, cursor, limit);
    res.json(result);
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const message = await messageService.createMessage(req.params.channelId as string, req.userId!, req.body.content);
    res.status(201).json(message);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const message = await messageService.updateMessage(req.params.messageId as string, req.userId!, req.body.content);
    res.json(message);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await messageService.deleteMessage(req.params.messageId as string, req.userId!);
    res.json(result);
  } catch (err) { next(err); }
}
