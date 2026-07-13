import { describe, expect, it, vi } from 'vitest';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { runDemoTick } = await import('./demo-engine');

// rng() => 0 always lands on the first weighted event, POST (see
// demo-engine.test.ts for why pickWeightedEvent behaves this way).
const alwaysPost = () => 0;

describe('runDemoTick idempotency', () => {
  it('only creates one row for the same idempotency key even if called twice', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'bot-1' } as never]);
    prismaMock.post.findFirst.mockResolvedValue(null);

    prismaMock.post.create.mockResolvedValueOnce({ id: 'post-1' } as never);
    const first = await runDemoTick('user-1', 'user-1:1000', alwaysPost);
    expect(first).toEqual({ event: 'POST', detail: 'bot-1' });

    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prismaMock.post.create.mockRejectedValueOnce(p2002);
    const second = await runDemoTick('user-1', 'user-1:1000', alwaysPost);

    expect(second).toBeNull();
    expect(prismaMock.post.create).toHaveBeenCalledTimes(2);
  });

  it('propagates non-unique-constraint errors instead of swallowing them', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'bot-1' } as never]);
    prismaMock.post.findFirst.mockResolvedValue(null);
    prismaMock.post.create.mockRejectedValueOnce(new Error('some other database error'));

    await expect(runDemoTick('user-1', 'user-1:1000', alwaysPost)).rejects.toThrow('some other database error');
  });
});
