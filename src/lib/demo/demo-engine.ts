import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { COMMENT_TEMPLATES, POST_TEMPLATES, pickAvoidingRepeat } from './content';
import { findLatestUnansweredMessage, tryMaterializeReply } from './reply-engine';

export type DemoEventType =
  | 'POST'
  | 'LIKE'
  | 'COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'MESSAGE'
  | 'MESSAGE_REPLY'
  | 'EVENT_ATTEND';

export type RandomFn = () => number;

// Section 2 of the spec, in event-type order.
const WEIGHTS: [DemoEventType, number][] = [
  ['POST', 15],
  ['LIKE', 20],
  ['COMMENT', 15],
  ['FRIEND_REQUEST', 10],
  ['FRIEND_ACCEPT', 10],
  ['MESSAGE', 15],
  ['MESSAGE_REPLY', 10],
  ['EVENT_ATTEND', 5],
];

/** Weighted-random event type selection. Accepts an injectable RNG
 * (`rng(): number` in [0,1)) so tests can use a seeded generator instead of
 * Math.random for deterministic assertions. */
export function pickWeightedEvent(rng: RandomFn = Math.random): DemoEventType {
  const total = WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [type, weight] of WEIGHTS) {
    if (roll < weight) return type;
    roll -= weight;
  }
  return WEIGHTS[WEIGHTS.length - 1][0];
}

const DEMO_POST_IMAGES = [
  '/assets/js/images/img5.png',
  '/assets/js/images/img6.png',
  '/assets/js/images/img7.png',
  '/assets/js/images/photos4.png',
  '/assets/js/images/photos5.png',
  '/assets/js/images/f3.png',
  null,
  null, // weight text-only posts more heavily than image posts
];

async function getRandomDemoBot(excludeIds: string[] = []) {
  const bots = await prisma.user.findMany({
    where: { isDemoAccount: true, id: { notIn: excludeIds } },
    select: { id: true },
  });
  if (bots.length === 0) return null;
  return bots[Math.floor(Math.random() * bots.length)];
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 'P2002';
}

export type TickResult = { event: DemoEventType; detail: string } | null;

async function handlePost(idempotencyKey: string): Promise<TickResult> {
  const bot = await getRandomDemoBot();
  if (!bot) return null;

  const lastPost = await prisma.post.findFirst({ where: { userId: bot.id }, orderBy: { createdAt: 'desc' } });
  const content = pickAvoidingRepeat(POST_TEMPLATES, lastPost?.content ?? null);
  const imageUrl = DEMO_POST_IMAGES[Math.floor(Math.random() * DEMO_POST_IMAGES.length)];

  try {
    await prisma.post.create({
      data: { userId: bot.id, content, imageUrl, visibility: 'PUBLIC', demoEventKey: idempotencyKey },
    });
    return { event: 'POST', detail: bot.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleLike(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const targetPost = await prisma.post.findFirst({
    where: { userId: tickUserId, likes: { none: { user: { isDemoAccount: true } } } },
    orderBy: { createdAt: 'desc' },
  });
  if (!targetPost) return null;

  const bot = await getRandomDemoBot();
  if (!bot) return null;

  try {
    await prisma.like.create({ data: { userId: bot.id, postId: targetPost.id, demoEventKey: idempotencyKey } });
    await createNotification({ userId: tickUserId, actorId: bot.id, type: 'LIKE', postId: targetPost.id });
    return { event: 'LIKE', detail: targetPost.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleComment(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const targetPost = await prisma.post.findFirst({
    where: { userId: tickUserId },
    orderBy: { createdAt: 'desc' },
  });
  if (!targetPost) return null;

  const bot = await getRandomDemoBot();
  if (!bot) return null;

  const content = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];

  try {
    const comment = await prisma.comment.create({
      data: { userId: bot.id, postId: targetPost.id, content, demoEventKey: idempotencyKey },
    });
    await createNotification({ userId: tickUserId, actorId: bot.id, type: 'COMMENT', postId: targetPost.id, commentId: comment.id });
    return { event: 'COMMENT', detail: comment.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleFriendRequest(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const existingConnections = await prisma.friendship.findMany({ where: { userId: tickUserId }, select: { friendId: true } });
  const existingRequests = await prisma.friendRequest.findMany({
    where: { OR: [{ senderId: tickUserId }, { receiverId: tickUserId }], status: 'PENDING' },
    select: { senderId: true, receiverId: true },
  });
  const excludeIds = [
    tickUserId,
    ...existingConnections.map((c) => c.friendId),
    ...existingRequests.map((r) => (r.senderId === tickUserId ? r.receiverId : r.senderId)),
  ];

  const bot = await getRandomDemoBot(excludeIds);
  if (!bot) return null;

  try {
    await prisma.friendRequest.create({
      data: { senderId: bot.id, receiverId: tickUserId, status: 'PENDING', demoEventKey: idempotencyKey },
    });
    await createNotification({ userId: tickUserId, actorId: bot.id, type: 'FRIEND_REQUEST' });
    return { event: 'FRIEND_REQUEST', detail: bot.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleFriendAccept(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const pendingSentToBot = await prisma.friendRequest.findFirst({
    where: { senderId: tickUserId, status: 'PENDING', receiver: { isDemoAccount: true } },
  });
  if (!pendingSentToBot) return null;

  try {
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: pendingSentToBot.id },
        data: { status: 'ACCEPTED', demoEventKey: idempotencyKey },
      }),
      prisma.friendship.create({ data: { userId: tickUserId, friendId: pendingSentToBot.receiverId } }),
      prisma.friendship.create({ data: { userId: pendingSentToBot.receiverId, friendId: tickUserId } }),
    ]);
    await createNotification({ userId: tickUserId, actorId: pendingSentToBot.receiverId, type: 'FRIEND_ACCEPTED' });
    return { event: 'FRIEND_ACCEPT', detail: pendingSentToBot.receiverId };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleMessage(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const bot = await getRandomDemoBot();
  if (!bot) return null;

  const CONVERSATION_STARTERS = [
    'Hey! Been a while, how have you been?',
    'Saw your latest post — nice work!',
    'Quick one: are you around for the next event?',
    "Hope you're having a good week!",
  ];
  const content = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];

  try {
    await prisma.message.create({
      data: { senderId: bot.id, receiverId: tickUserId, content, demoEventKey: idempotencyKey },
    });
    await createNotification({ userId: tickUserId, actorId: bot.id, type: 'MESSAGE' });
    return { event: 'MESSAGE', detail: bot.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

async function handleMessageReply(tickUserId: string): Promise<TickResult> {
  const bots = await prisma.user.findMany({ where: { isDemoAccount: true }, select: { id: true } });
  for (const bot of bots) {
    const unanswered = await findLatestUnansweredMessage(tickUserId, bot.id);
    if (!unanswered) continue;
    const reply = await tryMaterializeReply(unanswered);
    if (reply) return { event: 'MESSAGE_REPLY', detail: reply.id };
  }
  return null;
}

async function handleEventAttend(tickUserId: string, idempotencyKey: string): Promise<TickResult> {
  const event = await prisma.event.findFirst({
    where: { attendees: { none: { user: { isDemoAccount: true } } }, eventDate: { gte: new Date() } },
    orderBy: { eventDate: 'asc' },
  });
  if (!event) return null;

  const bot = await getRandomDemoBot();
  if (!bot) return null;

  try {
    await prisma.eventAttendee.create({ data: { eventId: event.id, userId: bot.id, demoEventKey: idempotencyKey } });
    if (event.createdById === tickUserId) {
      await createNotification({ userId: tickUserId, actorId: bot.id, type: 'EVENT', eventId: event.id });
    }
    return { event: 'EVENT_ATTEND', detail: event.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) return null;
    throw err;
  }
}

/** Runs exactly one weighted-random demo event for `tickUserId`, or none if
 * the chosen event type has no valid target right now (e.g. no pending
 * request to accept). `idempotencyKey` is `${userId}:${timeBucket}` from the
 * caller — MESSAGE_REPLY ignores it and uses its own message-scoped key
 * instead, since that path is also reachable from the chat UI's own polling
 * and both must agree on the same key. */
export async function runDemoTick(tickUserId: string, idempotencyKey: string, rng: RandomFn = Math.random): Promise<TickResult> {
  const eventType = pickWeightedEvent(rng);

  switch (eventType) {
    case 'POST':
      return handlePost(idempotencyKey);
    case 'LIKE':
      return handleLike(tickUserId, idempotencyKey);
    case 'COMMENT':
      return handleComment(tickUserId, idempotencyKey);
    case 'FRIEND_REQUEST':
      return handleFriendRequest(tickUserId, idempotencyKey);
    case 'FRIEND_ACCEPT':
      return handleFriendAccept(tickUserId, idempotencyKey);
    case 'MESSAGE':
      return handleMessage(tickUserId, idempotencyKey);
    case 'MESSAGE_REPLY':
      return handleMessageReply(tickUserId);
    case 'EVENT_ATTEND':
      return handleEventAttend(tickUserId, idempotencyKey);
    default:
      return null;
  }
}
