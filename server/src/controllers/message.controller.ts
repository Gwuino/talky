import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as messageService from '../services/message.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const result = await messageService.getMessages(req.params.channelId as string, getAuthUserId(req), cursor, limit);
  res.json(result);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await messageService.createMessage(req.params.channelId as string, getAuthUserId(req), req.body.content);
  res.status(201).json(message);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await messageService.updateMessage(req.params.messageId as string, getAuthUserId(req), req.body.content);
  res.json(message);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await messageService.deleteMessage(req.params.messageId as string, getAuthUserId(req));
  res.status(204).send();
});
