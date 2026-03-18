import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export async function getConversations(userId: string) {
  const participations = await prisma.dMParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  return participations.map((p) => ({
    ...p.conversation,
    otherUser: p.conversation.participants.find((pp) => pp.userId !== userId)?.user,
    lastMessage: p.conversation.messages[0] || null,
  }));
}

export async function getOrCreateConversation(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new BadRequestError('Cannot create a conversation with yourself');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new NotFoundError('User not found');

  // Check for existing conversation
  const existing = await prisma.dMConversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
        },
      },
    },
  });

  if (existing) return existing;

  // Use transaction to prevent duplicate DM conversations
  return prisma.$transaction(async (tx) => {
    // Double-check inside transaction
    const doubleCheck = await tx.dMConversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
          },
        },
      },
    });
    if (doubleCheck) return doubleCheck;

    return tx.dMConversation.create({
      data: {
        participants: {
          createMany: {
            data: [{ userId }, { userId: targetUserId }],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, status: true } },
          },
        },
      },
    });
  });
}

export async function getDMMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
  const participant = await prisma.dMParticipant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!participant) throw new ForbiddenError('You are not a participant of this conversation');

  const where: Prisma.DirectMessageWhereInput = { conversationId };
  if (cursor) {
    const cursorMsg = await prisma.directMessage.findUnique({ where: { id: cursor } });
    if (cursorMsg) {
      where.createdAt = { lt: cursorMsg.createdAt };
    }
  }

  const messages = await prisma.directMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages: messages.reverse(),
    hasMore,
  };
}

export async function createDM(conversationId: string, senderId: string, content: string) {
  const participant = await prisma.dMParticipant.findUnique({
    where: { userId_conversationId: { userId: senderId, conversationId } },
  });
  if (!participant) throw new ForbiddenError('You are not a participant of this conversation');

  return prisma.directMessage.create({
    data: { content, senderId, conversationId },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}
