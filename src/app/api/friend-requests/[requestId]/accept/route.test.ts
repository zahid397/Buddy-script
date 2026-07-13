import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-2') }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { POST } = await import('./route');

describe('POST /api/friend-requests/[requestId]/accept', () => {
  it('creates exactly one symmetric friendship (two directional rows = one mutual relationship)', async () => {
    // By design this app models a single mutual friendship as two rows,
    // one per direction (see src/lib/social.ts's deleteFriendshipPair,
    // which mirrors the same pattern for unfriending) — that's intentional,
    // not a bug, so this test asserts exactly two creates, one each way.
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      status: 'PENDING',
    } as never);
    prismaMock.$transaction.mockImplementation((ops) => Promise.all(ops as unknown as Promise<unknown>[]));
    prismaMock.friendRequest.update.mockResolvedValue({} as never);
    prismaMock.friendship.create.mockResolvedValue({} as never);

    const request = new NextRequest('http://localhost/api/friend-requests/req-1/accept', { method: 'POST' });
    const response = await POST(request, { params: { requestId: 'req-1' } });

    expect(response.status).toBe(200);
    expect(prismaMock.friendship.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.friendship.create).toHaveBeenCalledWith({ data: { userId: 'user-1', friendId: 'user-2' } });
    expect(prismaMock.friendship.create).toHaveBeenCalledWith({ data: { userId: 'user-2', friendId: 'user-1' } });
    expect(prismaMock.friendRequest.update).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the request does not belong to the caller', async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      senderId: 'user-1',
      receiverId: 'someone-else',
      status: 'PENDING',
    } as never);

    const request = new NextRequest('http://localhost/api/friend-requests/req-1/accept', { method: 'POST' });
    const response = await POST(request, { params: { requestId: 'req-1' } });

    expect(response.status).toBe(404);
    expect(prismaMock.friendship.create).not.toHaveBeenCalled();
  });
});
