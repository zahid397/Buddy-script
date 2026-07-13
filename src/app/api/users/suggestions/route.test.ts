import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));

const { GET } = await import('./route');

describe('GET /api/users/suggestions', () => {
  it('excludes existing friends from the candidate query', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ location: null, interests: [] } as never);
    prismaMock.friendship.findMany.mockResolvedValue([{ friendId: 'friend-1' } as never]);
    prismaMock.block.findMany.mockResolvedValue([]);
    prismaMock.dismissedSuggestion.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/users/suggestions?type=friends&limit=5');
    await GET(request);

    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
    const callArgs = prismaMock.user.findMany.mock.calls[0][0] as { where: { id: { notIn: string[] } } };
    expect(callArgs.where.id.notIn).toContain('friend-1');
    expect(callArgs.where.id.notIn).toContain('user-1');
  });

  it('excludes blocked and dismissed users too', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ location: null, interests: [] } as never);
    prismaMock.friendship.findMany.mockResolvedValue([]);
    prismaMock.block.findMany.mockResolvedValue([{ blockerId: 'user-1', blockedId: 'blocked-1' } as never]);
    prismaMock.dismissedSuggestion.findMany.mockResolvedValue([{ dismissedId: 'dismissed-1' } as never]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/users/suggestions?type=friends&limit=5');
    await GET(request);

    const callArgs = prismaMock.user.findMany.mock.calls[0][0] as { where: { id: { notIn: string[] } } };
    expect(callArgs.where.id.notIn).toContain('blocked-1');
    expect(callArgs.where.id.notIn).toContain('dismissed-1');
  });
});
