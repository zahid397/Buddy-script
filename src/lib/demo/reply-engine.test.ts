import { describe, expect, it, vi } from 'vitest';
import type { Message } from '@prisma/client';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));

const { tryMaterializeReply, markSeenIfDue } = await import('./reply-engine');

function fakeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'bot-1',
    content: 'Hey! How is the project going?',
    // Far enough in the past that both the 1-2s typing-start and the 3-8s
    // reply-due thresholds have unconditionally elapsed, regardless of the
    // per-message hashed offset.
    createdAt: new Date(Date.now() - 20_000),
    readAt: null,
    isAutoReply: false,
    demoEventKey: null,
    ...overrides,
  };
}

describe('tryMaterializeReply — automated messages create one reply only', () => {
  it('creates exactly one reply even when called twice for the same message', async () => {
    const message = fakeMessage();
    prismaMock.message.findFirst.mockResolvedValue(null); // no prior bot reply
    prismaMock.message.update.mockResolvedValue({} as never); // the seen-marking side effect

    prismaMock.message.create.mockResolvedValueOnce({ id: 'reply-1' } as never);
    const first = await tryMaterializeReply(message);
    expect(first).not.toBeNull();
    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ demoEventKey: `reply:${message.id}` }) })
    );

    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prismaMock.message.create.mockRejectedValueOnce(p2002);
    const second = await tryMaterializeReply(message);

    expect(second).toBeNull();
    expect(prismaMock.message.create).toHaveBeenCalledTimes(2);
  });

  it('returns null without creating anything when the reply is not due yet', async () => {
    const message = fakeMessage({ createdAt: new Date() }); // just sent

    const result = await tryMaterializeReply(message);

    expect(result).toBeNull();
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });
});

describe('markSeenIfDue — seen status updates correctly', () => {
  it('marks the message read once the typing-start threshold has elapsed', async () => {
    const message = fakeMessage({ readAt: null });
    prismaMock.message.update.mockResolvedValue({} as never);

    await markSeenIfDue(message);

    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: { id: message.id },
      data: { readAt: expect.any(Date) },
    });
  });

  it('does nothing if already marked read', async () => {
    const message = fakeMessage({ readAt: new Date() });

    await markSeenIfDue(message);

    expect(prismaMock.message.update).not.toHaveBeenCalled();
  });

  it('does nothing yet if the message was only just sent', async () => {
    const message = fakeMessage({ createdAt: new Date(), readAt: null });

    await markSeenIfDue(message);

    expect(prismaMock.message.update).not.toHaveBeenCalled();
  });
});
