import { describe, expect, it, vi } from 'vitest';
import { prismaMock } from './testUtils/prismaMock';

vi.mock('./prisma', () => ({ prisma: prismaMock }));

const { areFriends } = await import('./social');

describe('areFriends', () => {
  it('returns true when a Friendship row exists', async () => {
    prismaMock.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      userId: 'a',
      friendId: 'b',
      createdAt: new Date(),
    });

    await expect(areFriends('a', 'b')).resolves.toBe(true);
  });

  it('returns false when no Friendship row exists', async () => {
    prismaMock.friendship.findUnique.mockResolvedValue(null);

    await expect(areFriends('a', 'c')).resolves.toBe(false);
  });

  it('returns true for the same user without hitting the database', async () => {
    await expect(areFriends('a', 'a')).resolves.toBe(true);
    expect(prismaMock.friendship.findUnique).not.toHaveBeenCalled();
  });
});
