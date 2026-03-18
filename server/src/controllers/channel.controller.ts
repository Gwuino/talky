import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as channelService from '../services/channel.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const getChannels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const channels = await channelService.getChannels(req.params.serverId as string, getAuthUserId(req));
  res.json(channels);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const channel = await channelService.createChannel(req.params.serverId as string, getAuthUserId(req), req.body.name, req.body.type);
  res.status(201).json(channel);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const channel = await channelService.updateChannel(req.params.channelId as string, getAuthUserId(req), req.body);
  res.json(channel);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await channelService.deleteChannel(req.params.channelId as string, getAuthUserId(req));
  res.status(204).send();
});
