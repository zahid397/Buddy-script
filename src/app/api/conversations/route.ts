import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import type { ConversationDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { sender: true, receiver: true },
    take: 500,
  });

  const unreadGroups = await prisma.message.groupBy({
    by: ['senderId'],
    where: { receiverId: userId, readAt: null },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadGroups.map((u) => [u.senderId, u._count._all]));

  const seen = new Set<string>();
  const conversations: ConversationDTO[] = [];
  for (const m of messages) {
    const counterparty = m.senderId === userId ? m.receiver : m.sender;
    if (seen.has(counterparty.id)) continue;
    seen.add(counterparty.id);
    conversations.push({
      user: toPostAuthor(counterparty),
      lastMessage: {
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        readAt: m.readAt?.toISOString() ?? null,
      },
      unreadCount: unreadMap.get(counterparty.id) ?? 0,
    });
  }

  return NextResponse.json({ items: conversations });
}
