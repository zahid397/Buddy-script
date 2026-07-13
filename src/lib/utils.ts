import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import type { PostAuthor, PublicUser } from '@/types';

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPostAuthor(user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>): PostAuthor {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };
}
