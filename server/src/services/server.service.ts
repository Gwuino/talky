import prisma from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export async function createServer(userId: string, name: string) {
  const server = await prisma.server.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
      channels: {
        createMany: {
          data: [
            { name: 'general', type: 'TEXT', position: 0 },
            { name: 'voice', type: 'VOICE', position: 1 },
          ],
        },
      },
    },
    include: { channels: true, members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } } } } },
  });
  return server;
}

export async function getServer(serverId: string, userId: string) {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      channels: { orderBy: { position: 'asc' } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
        },
      },
    },
  });
  if (!server) throw new NotFoundError('Server not found');
  return server;
}

export async function getUserServers(userId: string) {
  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    include: {
      server: {
        select: { id: true, name: true, iconUrl: true },
      },
    },
  });
  return memberships.map((m) => m.server);
}

export async function joinByInvite(userId: string, inviteCode: string) {
  const server = await prisma.server.findUnique({ where: { inviteCode } });
  if (!server) throw new NotFoundError('Invalid invite code');

  const existing = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId: server.id } },
  });
  if (existing) throw new BadRequestError('Already a member of this server');

  await prisma.serverMember.create({
    data: { userId, serverId: server.id },
  });

  return getServer(server.id, userId);
}

export async function deleteServer(serverId: string, userId: string) {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new NotFoundError('Server not found');
  if (server.ownerId !== userId) throw new ForbiddenError('Only the owner can delete the server');

  await prisma.server.delete({ where: { id: serverId } });
}

export async function getMembers(serverId: string, userId: string) {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');

  return prisma.serverMember.findMany({
    where: { serverId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
    },
  });
}

export async function getInviteCode(serverId: string, userId: string) {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { inviteCode: true },
  });
  if (!server) throw new NotFoundError('Server not found');
  return server.inviteCode;
}
