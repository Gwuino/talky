import prisma from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import * as dmService from './dm.service';

const userSelect = { id: true, username: true, displayName: true, avatarUrl: true, status: true };

export async function sendRequest(senderId: string, targetUserId: string) {
  if (senderId === targetUserId) {
    throw new BadRequestError('Cannot send a friend request to yourself');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new NotFoundError('User not found');

  // Check for existing friendship in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') throw new BadRequestError('Already friends');
    if (existing.status === 'PENDING') throw new BadRequestError('Friend request already pending');
    if (existing.status === 'BLOCKED') throw new BadRequestError('Cannot send request');
    // DECLINED — allow re-sending by deleting old and creating new
    await prisma.friendship.delete({ where: { id: existing.id } });
  }

  return prisma.friendship.create({
    data: { senderId, receiverId: targetUserId },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });
}

export async function acceptRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });

  if (!friendship) throw new NotFoundError('Friend request not found');
  if (friendship.receiverId !== userId) throw new ForbiddenError('Only the receiver can accept');
  if (friendship.status !== 'PENDING') throw new BadRequestError('Request is not pending');

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'ACCEPTED' },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });

  // Auto-create DM conversation
  await dmService.getOrCreateConversation(friendship.senderId, friendship.receiverId);

  return updated;
}

export async function declineRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new NotFoundError('Friend request not found');
  if (friendship.receiverId !== userId) throw new ForbiddenError('Only the receiver can decline');
  if (friendship.status !== 'PENDING') throw new BadRequestError('Request is not pending');

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'DECLINED' },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });
}

export async function removeFriend(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new NotFoundError('Friendship not found');
  if (friendship.senderId !== userId && friendship.receiverId !== userId) {
    throw new ForbiddenError('Not your friendship');
  }

  return prisma.friendship.delete({
    where: { id: friendshipId },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });
}

export async function blockUser(userId: string, targetUserId: string) {
  if (userId === targetUserId) throw new BadRequestError('Cannot block yourself');

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new NotFoundError('User not found');

  // Remove any existing friendship in either direction
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
  });

  return prisma.friendship.create({
    data: { senderId: userId, receiverId: targetUserId, status: 'BLOCKED' },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
  });
}

export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: userSelect },
      receiver: { select: userSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return friendships.map((f) => ({
    ...f,
    friend: f.senderId === userId ? f.receiver : f.sender,
  }));
}

export async function getPendingRequests(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendship.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { incoming, outgoing };
}

export async function getFriendshipStatus(userId: string, targetUserId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
  });

  return friendship;
}
