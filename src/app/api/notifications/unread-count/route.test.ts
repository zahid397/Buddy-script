import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));

const { GET } = await import('./route');

describe('GET /api/notifications/unread-count', () => {
  it('returns the current unread count for the caller', async () => {
    prismaMock.notification.count.mockResolvedValue(3);

    const request = new NextRequest('http://localhost/api/notifications/unread-count');
    const response = await GET(request);
    const json = await response.json();

    expect(json).toEqual({ count: 3 });
    expect(prismaMock.notification.count).toHaveBeenCalledWith({ where: { userId: 'user-1', isRead: false } });
  });
});
