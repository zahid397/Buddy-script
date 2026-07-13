import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));
vi.mock('@/lib/social', () => ({ canViewPost: vi.fn().mockResolvedValue(true) }));

const { POST, DELETE } = await import('./route');

function request(method: 'POST' | 'DELETE') {
  return new NextRequest('http://localhost/api/posts/post-1/save', { method });
}

describe('POST /api/posts/[postId]/save', () => {
  it('upserts on (userId, postId) so saving twice never duplicates the bookmark', async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'someone-else' } as never);
    prismaMock.savedPost.upsert.mockResolvedValue({} as never);

    const response = await POST(request('POST'), { params: { postId: 'post-1' } });
    const json = await response.json();

    expect(json).toEqual({ savedByMe: true });
    expect(prismaMock.savedPost.upsert).toHaveBeenCalledWith({
      where: { userId_postId: { userId: 'user-1', postId: 'post-1' } },
      create: { userId: 'user-1', postId: 'post-1' },
      update: {},
    });
  });

  it('returns 404 for a post the caller cannot view', async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    const response = await POST(request('POST'), { params: { postId: 'missing' } });

    expect(response.status).toBe(404);
    expect(prismaMock.savedPost.upsert).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/posts/[postId]/save', () => {
  it('removes the bookmark for the caller only', async () => {
    prismaMock.savedPost.deleteMany.mockResolvedValue({ count: 1 } as never);

    const response = await DELETE(request('DELETE'), { params: { postId: 'post-1' } });
    const json = await response.json();

    expect(json).toEqual({ savedByMe: false });
    expect(prismaMock.savedPost.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', postId: 'post-1' } });
  });
});
