import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as dmService from '../services/dm.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await dmService.getConversations(getAuthUserId(req));
  res.json(conversations);
});

export const createConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await dmService.getOrCreateConversation(getAuthUserId(req), req.body.targetUserId);
  res.json(conversation);
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const result = await dmService.getDMMessages(req.params.conversationId as string, getAuthUserId(req), cursor, limit);
  res.json(result);
});
