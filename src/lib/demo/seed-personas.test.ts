import { describe, expect, it, vi } from 'vitest';
import { prismaMock } from '@/lib/testUtils/prismaMock';
import { DEMO_PERSONAS } from './personas';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { seedDemoPersonas } = await import('./seed-personas');

const personaIds = DEMO_PERSONAS.map((_, i) => `bot-${i}`);

function setUpHappyPathMocks() {
  prismaMock.user.upsert.mockImplementation((({ where }: { where: { email: string } }) => {
    const index = DEMO_PERSONAS.findIndex((p) => p.email === where.email);
    return Promise.resolve({ id: personaIds[index], email: DEMO_PERSONAS[index].email });
  }) as never);
  prismaMock.replyLike.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.commentLike.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.like.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.reply.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.comment.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.post.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.friendRequest.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.friendship.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.message.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.eventAttendee.deleteMany.mockResolvedValue({ count: 0 } as never);
  prismaMock.post.create.mockResolvedValue({ id: 'post-x' } as never);
  prismaMock.post.findMany.mockResolvedValue([]);
  prismaMock.friendship.upsert.mockResolvedValue({} as never);
  prismaMock.message.create.mockResolvedValue({} as never);
  prismaMock.event.findMany.mockResolvedValue([]);
}

describe('seedDemoPersonas — real users are never touched', () => {
  it('only ever upserts the fixed fictional persona emails, never deletes or updates any User row', async () => {
    setUpHappyPathMocks();

    const result = await seedDemoPersonas();

    expect(result.personaCount).toBe(DEMO_PERSONAS.length);
    expect(prismaMock.user.upsert).toHaveBeenCalledTimes(DEMO_PERSONAS.length);
    for (const persona of DEMO_PERSONAS) {
      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: persona.email },
          create: expect.objectContaining({ source: 'DEMO_BOT', isDemoAccount: true }),
        })
      );
    }

    // The seed never deletes, mass-updates, or otherwise mutates the User
    // table itself — only content owned by the persona ids it just
    // upserted. This is the property that keeps a real reviewer's account
    // (or its posts/friendships) safe if they hit /api/demo/reset.
    expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('scopes every content deletion strictly to the persona ids it owns', async () => {
    setUpHappyPathMocks();

    await seedDemoPersonas();

    expect(prismaMock.post.deleteMany).toHaveBeenCalledWith({ where: { userId: { in: personaIds } } });
    expect(prismaMock.eventAttendee.deleteMany).toHaveBeenCalledWith({ where: { userId: { in: personaIds } } });
    expect(prismaMock.friendship.deleteMany).toHaveBeenCalledWith({ where: { userId: { in: personaIds } } });

    const messageDeleteArgs = prismaMock.message.deleteMany.mock.calls[0][0];
    expect(messageDeleteArgs).toEqual({
      where: { OR: [{ senderId: { in: personaIds } }, { receiverId: { in: personaIds } }] },
    });
  });
});
