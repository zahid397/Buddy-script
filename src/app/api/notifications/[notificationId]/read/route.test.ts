import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));

const { POST } = await import('./route');

function request() {
  return new NextRequest('http://localhost/api/notifications/notif-1/read', { method: 'POST' });
}

describe('POST /api/notifications/[notificationId]/read', () => {
  it('marks the notification read when it belongs to the caller', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 'notif-1', userId: 'user-1' } as never);
    prismaMock.notification.update.mockResolvedValue({} as never);

    const response = await POST(request(), { params: { notificationId: 'notif-1' } });

    expect(response.status).toBe(200);
    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { isRead: true },
    });
  });

  it('returns 404 and does not update when the notification belongs to someone else', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 'notif-1', userId: 'someone-else' } as never);

    const response = await POST(request(), { params: { notificationId: 'notif-1' } });

    expect(response.status).toBe(404);
    expect(prismaMock.notification.update).not.toHaveBeenCalled();
  });
});
