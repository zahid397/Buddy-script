import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { DEMO_PERSONAS } from './personas';
import { COMMENT_TEMPLATES, POST_TEMPLATES } from './content';

/** Upserts the fixed roster of DEMO_BOT personas and refreshes only the
 * content they own (their own posts/comments/friendships/DMs among
 * themselves, plus RSVPs on existing events) — never touches real users or
 * their data, same safety pattern as prisma/seed.ts. Used by both the CLI
 * seed script and POST /api/demo/reset. Per-real-user targeted activity
 * (friend requests to you, likes on your posts, etc.) is the tick engine's
 * job at runtime, not this static seed — this just gives the personas
 * ambient presence so the feed/friends graph isn't empty on first load. */
export async function seedDemoPersonas(): Promise<{ personaCount: number }> {
  // Unusable, unique per run — DEMO_BOT accounts can't log in via password
  // anyway (blocked in the login route), this is just satisfying the
  // non-null schema column.
  const unusablePassword = await bcrypt.hash(`demo-bot-${Date.now()}-${Math.random()}`, 10);

  const personas = [];
  for (const def of DEMO_PERSONAS) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {
        firstName: def.firstName,
        lastName: def.lastName,
        bio: def.bio,
        location: def.location,
        interests: def.interests,
        avatarUrl: def.avatarUrl,
        source: 'DEMO_BOT',
        isDemoAccount: true,
      },
      create: {
        firstName: def.firstName,
        lastName: def.lastName,
        email: def.email,
        password: unusablePassword,
        bio: def.bio,
        location: def.location,
        interests: def.interests,
        avatarUrl: def.avatarUrl,
        source: 'DEMO_BOT',
        isDemoAccount: true,
      },
    });
    personas.push(user);
  }
  const personaIds = personas.map((p) => p.id);

  await prisma.replyLike.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { reply: { userId: { in: personaIds } } }] } });
  await prisma.commentLike.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { comment: { userId: { in: personaIds } } }] } });
  await prisma.like.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { post: { userId: { in: personaIds } } }] } });
  await prisma.reply.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { comment: { userId: { in: personaIds } } }] } });
  await prisma.comment.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { post: { userId: { in: personaIds } } }] } });
  await prisma.post.deleteMany({ where: { userId: { in: personaIds } } });
  await prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: { in: personaIds } }, { receiverId: { in: personaIds } }] } });
  await prisma.friendship.deleteMany({ where: { userId: { in: personaIds } } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: personaIds } }, { receiverId: { in: personaIds } }] } });
  await prisma.notification.deleteMany({ where: { OR: [{ userId: { in: personaIds } }, { actorId: { in: personaIds } }] } });
  await prisma.eventAttendee.deleteMany({ where: { userId: { in: personaIds } } });

  for (const persona of personas) {
    const postCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < postCount; i++) {
      await prisma.post.create({
        data: {
          userId: persona.id,
          content: POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)],
          visibility: 'PUBLIC',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000 - i * 60 * 60 * 1000),
        },
      });
    }
  }

  const personaPosts = await prisma.post.findMany({ where: { userId: { in: personaIds } } });
  for (const post of personaPosts) {
    if (Math.random() < 0.4) {
      const commenter = personas[Math.floor(Math.random() * personas.length)];
      if (commenter.id !== post.userId) {
        await prisma.comment.create({
          data: {
            userId: commenter.id,
            postId: post.id,
            content: COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)],
          },
        });
      }
    }
  }

  for (let i = 0; i < personas.length - 1; i += 2) {
    const a = personas[i];
    const b = personas[i + 1];
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId: a.id, friendId: b.id } },
      update: {},
      create: { userId: a.id, friendId: b.id },
    });
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId: b.id, friendId: a.id } },
      update: {},
      create: { userId: b.id, friendId: a.id },
    });
  }

  for (let i = 0; i < 3 && i + 1 < personas.length; i++) {
    await prisma.message.create({
      data: {
        senderId: personas[i].id,
        receiverId: personas[i + 1].id,
        content: 'Hey! Excited to be part of this community.',
      },
    });
  }

  const events = await prisma.event.findMany();
  for (const event of events) {
    const shuffled = [...personas].sort(() => Math.random() - 0.5);
    const attendeeCount = 3 + Math.floor(Math.random() * 3);
    for (const attendee of shuffled.slice(0, attendeeCount)) {
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: event.id, userId: attendee.id } },
        update: {},
        create: { eventId: event.id, userId: attendee.id },
      });
    }
  }

  return { personaCount: personas.length };
}
