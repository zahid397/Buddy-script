import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { POST } = await import('./route');

function request(body: unknown) {
  return new NextRequest('http://localhost/api/groups/group-1/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/groups/[groupId]/posts', () => {
  it('rejects posting from a non-member with 403 and never creates the post', async () => {
    prismaMock.groupMember.findUnique.mockResolvedValue(null);

    const response = await POST(request({ content: 'Hello group' }), { params: { groupId: 'group-1' } });

    expect(response.status).toBe(403);
    expect(prismaMock.groupPost.create).not.toHaveBeenCalled();
  });

  it('creates the post and notifies other members when the caller is a member', async () => {
    prismaMock.groupMember.findUnique.mockResolvedValue({ groupId: 'group-1', userId: 'user-1' } as never);
    prismaMock.groupPost.create.mockResolvedValue({
      id: 'post-1',
      content: 'Hello group',
      createdAt: new Date(),
      user: { id: 'user-1', firstName: 'A', lastName: 'B', avatarUrl: null, isDemoAccount: false },
    } as never);
    prismaMock.groupMember.findMany.mockResolvedValue([{ userId: 'user-2' }, { userId: 'user-3' }] as never);

    const response = await POST(request({ content: 'Hello group' }), { params: { groupId: 'group-1' } });

    expect(response.status).toBe(201);
    expect(prismaMock.groupPost.create).toHaveBeenCalledWith({
      data: { groupId: 'group-1', userId: 'user-1', content: 'Hello group' },
      include: { user: true },
    });
  });
});
