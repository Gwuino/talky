import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as channelService from '../services/channel.service';

export async function getChannels(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const channels = await channelService.getChannels(req.params.serverId as string, req.userId!);
    res.json(channels);
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const channel = await channelService.createChannel(req.params.serverId as string, req.userId!, req.body.name, req.body.type);
    res.status(201).json(channel);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const channel = await channelService.updateChannel(req.params.channelId as string, req.userId!, req.body);
    res.json(channel);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await channelService.deleteChannel(req.params.channelId as string, req.userId!);
    res.status(204).send();
  } catch (err) { next(err); }
}
