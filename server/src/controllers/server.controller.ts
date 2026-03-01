import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as serverService from '../services/server.service';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await serverService.createServer(req.userId!, req.body.name);
    res.status(201).json(server);
  } catch (err) { next(err); }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await serverService.getServer(req.params.serverId as string, req.userId!);
    res.json(server);
  } catch (err) { next(err); }
}

export async function getUserServers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const servers = await serverService.getUserServers(req.userId!);
    res.json(servers);
  } catch (err) { next(err); }
}

export async function join(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await serverService.joinByInvite(req.userId!, req.body.inviteCode);
    res.json(server);
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await serverService.deleteServer(req.params.serverId as string, req.userId!);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const members = await serverService.getMembers(req.params.serverId as string, req.userId!);
    res.json(members);
  } catch (err) { next(err); }
}

export async function getInviteCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const inviteCode = await serverService.getInviteCode(req.params.serverId as string, req.userId!);
    res.json({ inviteCode });
  } catch (err) { next(err); }
}
