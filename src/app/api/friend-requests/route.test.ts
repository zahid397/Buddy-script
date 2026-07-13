import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { POST } = await import('./route');

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/friend-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/friend-requests', () => {
  it('rejects a duplicate pending friend request with 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' } as never);
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.friendship.findUnique.mockResolvedValue(null);
    // Reverse-direction lookup (did user-2 already request user-1?) -> no.
    // Forward-direction lookup (did user-1 already request user-2?) -> yes, PENDING.
    prismaMock.friendRequest.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'req-1', status: 'PENDING' } as never);

    const response = await POST(postRequest({ receiverId: 'user-2' }));

    expect(response.status).toBe(409);
    expect(prismaMock.friendRequest.create).not.toHaveBeenCalled();
  });
});
