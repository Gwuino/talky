import prisma from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export async function getMessages(channelId: string, userId: string, cursor?: string, limit = 50) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new NotFoundError('Channel not found');

  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId: channel.serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');

  const where: any = { channelId };
  if (cursor) {
    const cursorMessage = await prisma.message.findUnique({ where: { id: cursor } });
    if (cursorMessage) {
      where.createdAt = { lt: cursorMessage.createdAt };
    }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return {
    messages: messages.reverse(),
    hasMore: messages.length === limit,
  };
}

export async function createMessage(channelId: string, userId: string, content: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new NotFoundError('Channel not found');

  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId: channel.serverId } },
  });
  if (!member) throw new ForbiddenError('You are not a member of this server');

  return prisma.message.create({
    data: { content, userId, channelId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function updateMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new NotFoundError('Message not found');
  if (message.userId !== userId) throw new ForbiddenError('You can only edit your own messages');

  return prisma.message.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) throw new NotFoundError('Message not found');

  if (message.userId !== userId) {
    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId: message.channel.serverId } },
    });
    if (!member || member.role === 'MEMBER') {
      throw new ForbiddenError('You can only delete your own messages');
    }
  }

  await prisma.message.delete({ where: { id: messageId } });
  return { messageId, channelId: message.channelId };
}
