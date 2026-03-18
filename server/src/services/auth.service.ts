import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';

interface RegisterInput {
  username: string;
  displayName: string;
  password: string;
}

interface LoginInput {
  username: string;
  password: string;
}

export async function register(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        passwordHash,
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
    });

    const token = signToken({ sub: user.id, username: user.username });
    return { user, token };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new BadRequestError('Username already taken');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { username: input.username } });
  if (!user) {
    throw new UnauthorizedError('Invalid username or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid username or password');
  }

  const token = signToken({ sub: user.id, username: user.username });
  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true, status: true, createdAt: true },
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
