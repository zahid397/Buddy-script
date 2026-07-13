import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { POST, DELETE } = await import('./route');

function request(method: 'POST' | 'DELETE') {
  return new NextRequest('http://localhost/api/groups/group-1/join', { method });
}

describe('POST /api/groups/[groupId]/join', () => {
  it('upserts membership so joining twice never creates a duplicate row', async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: 'group-1', createdById: 'owner-1' } as never);
    prismaMock.groupMember.upsert.mockResolvedValue({} as never);
    prismaMock.groupMember.count.mockResolvedValue(4);

    const response = await POST(request('POST'), { params: { groupId: 'group-1' } });
    const json = await response.json();

    expect(json).toEqual({ isMember: true, memberCount: 4 });
    expect(prismaMock.groupMember.upsert).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: 'group-1', userId: 'user-1' } },
      update: {},
      create: { groupId: 'group-1', userId: 'user-1', role: 'MEMBER' },
    });
  });

  it('returns 404 when the group does not exist', async () => {
    prismaMock.group.findUnique.mockResolvedValue(null);

    const response = await POST(request('POST'), { params: { groupId: 'missing' } });

    expect(response.status).toBe(404);
    expect(prismaMock.groupMember.upsert).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/groups/[groupId]/join', () => {
  it('removes membership and returns the updated member count', async () => {
    prismaMock.groupMember.deleteMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.groupMember.count.mockResolvedValue(3);

    const response = await DELETE(request('DELETE'), { params: { groupId: 'group-1' } });
    const json = await response.json();

    expect(json).toEqual({ isMember: false, memberCount: 3 });
    expect(prismaMock.groupMember.deleteMany).toHaveBeenCalledWith({ where: { groupId: 'group-1', userId: 'user-1' } });
  });
});
