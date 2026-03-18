import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as serverService from '../services/server.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getAuthUserId } from '../utils/getAuthUserId';

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const server = await serverService.createServer(getAuthUserId(req), req.body.name);
  res.status(201).json(server);
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const server = await serverService.getServer(req.params.serverId as string, getAuthUserId(req));
  res.json(server);
});

export const getUserServers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const servers = await serverService.getUserServers(getAuthUserId(req));
  res.json(servers);
});

export const join = asyncHandler(async (req: AuthRequest, res: Response) => {
  const server = await serverService.joinByInvite(getAuthUserId(req), req.body.inviteCode);
  res.json(server);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await serverService.deleteServer(req.params.serverId as string, getAuthUserId(req));
  res.status(204).send();
});

export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const members = await serverService.getMembers(req.params.serverId as string, getAuthUserId(req));
  res.json(members);
});

export const getInviteCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inviteCode = await serverService.getInviteCode(req.params.serverId as string, getAuthUserId(req));
  res.json({ inviteCode });
});

export const leaveServer = asyncHandler(async (req: AuthRequest, res: Response) => {
  await serverService.leaveServer(req.params.serverId as string, getAuthUserId(req));
  res.status(204).send();
});
