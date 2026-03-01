import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true, status: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string | null }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, displayName: true, avatarUrl: true, status: true, createdAt: true },
  });
}

export async function searchUsers(query: string, excludeUserId: string) {
  return prisma.user.findMany({
    where: {
      AND: [
        { id: { not: excludeUserId } },
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true, status: true },
    take: 20,
  });
}
