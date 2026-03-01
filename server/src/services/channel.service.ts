import prisma from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { ChannelType } from '@prisma/client';

async function checkMembership(userId: string, serverId: string) {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');
  return member;
}

export async function getChannels(serverId: string, userId: string) {
  await checkMembership(userId, serverId);
  return prisma.channel.findMany({
    where: { serverId },
    orderBy: { position: 'asc' },
  });
}

export async function createChannel(serverId: string, userId: string, name: string, type: ChannelType) {
  const member = await checkMembership(userId, serverId);
  if (member.role === 'MEMBER') throw new ForbiddenError('Only admins can create channels');

  const maxPosition = await prisma.channel.aggregate({
    where: { serverId },
    _max: { position: true },
  });

  return prisma.channel.create({
    data: {
      name,
      type,
      serverId,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });
}

export async function updateChannel(channelId: string, userId: string, data: { name?: string; position?: number }) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
  if (!channel) throw new NotFoundError('Channel not found');

  const member = await checkMembership(userId, channel.serverId);
  if (member.role === 'MEMBER') throw new ForbiddenError('Only admins can update channels');

  return prisma.channel.update({ where: { id: channelId }, data });
}

export async function deleteChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
  if (!channel) throw new NotFoundError('Channel not found');

  const member = await checkMembership(userId, channel.serverId);
  if (member.role === 'MEMBER') throw new ForbiddenError('Only admins can delete channels');

  await prisma.channel.delete({ where: { id: channelId } });
}
