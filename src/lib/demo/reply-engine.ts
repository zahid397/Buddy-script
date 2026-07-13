import type { Message } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { classifyMessage, DM_REPLY_TEMPLATES, pickAvoidingRepeat } from './content';
import { replyOffsetMs, typingStartOffsetMs } from './timing';

/** The latest message a real user sent to a demo bot that the bot hasn't
 * replied to yet, if any. Shared by the tick engine's MESSAGE_REPLY handler
 * and the lazy on-read path in the messages API — both need the exact same
 * notion of "what's outstanding" so they never both try to answer it. */
export async function findLatestUnansweredMessage(userId: string, botId: string): Promise<Message | null> {
  const lastUserMessage = await prisma.message.findFirst({
    where: { senderId: userId, receiverId: botId },
    orderBy: { createdAt: 'desc' },
  });
  if (!lastUserMessage) return null;

  const botRepliedSince = await prisma.message.findFirst({
    where: { senderId: botId, receiverId: userId, createdAt: { gt: lastUserMessage.createdAt } },
    select: { id: true },
  });
  if (botRepliedSince) return null;

  return lastUserMessage;
}

export function isBotTypingFor(userMessage: Message): boolean {
  const now = Date.now();
  const typingStart = userMessage.createdAt.getTime() + typingStartOffsetMs(userMessage.id);
  const replyDue = userMessage.createdAt.getTime() + replyOffsetMs(userMessage.id);
  return now >= typingStart && now < replyDue;
}

export function isReplyDue(userMessage: Message): boolean {
  const replyDue = userMessage.createdAt.getTime() + replyOffsetMs(userMessage.id);
  return Date.now() >= replyDue;
}

/** Marks the user's message seen and creates the bot's reply, keyed by
 * `reply:${userMessage.id}` on Message.demoEventKey so this can safely be
 * called from both the polling chat UI and the tick engine — whichever
 * request gets there first wins, the other hits the unique constraint and
 * no-ops. Returns the created reply, or null if it wasn't due yet or was
 * already handled by a concurrent request. */
export async function tryMaterializeReply(userMessage: Message): Promise<Message | null> {
  if (!isReplyDue(userMessage)) return null;

  if (!userMessage.readAt) {
    await prisma.message.update({ where: { id: userMessage.id }, data: { readAt: new Date() } }).catch(() => undefined);
  }

  const lastBotReply = await prisma.message.findFirst({
    where: { senderId: userMessage.receiverId, receiverId: userMessage.senderId },
    orderBy: { createdAt: 'desc' },
  });

  const category = classifyMessage(userMessage.content);
  const content = pickAvoidingRepeat(DM_REPLY_TEMPLATES[category], lastBotReply?.content ?? null);

  try {
    const reply = await prisma.message.create({
      data: {
        senderId: userMessage.receiverId,
        receiverId: userMessage.senderId,
        content,
        isAutoReply: true,
        demoEventKey: `reply:${userMessage.id}`,
      },
    });
    await createNotification({ userId: userMessage.senderId, actorId: userMessage.receiverId, type: 'MESSAGE' });
    return reply;
  } catch {
    // P2002: another concurrent request already created this reply.
    return null;
  }
}
