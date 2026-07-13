import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { isTyping, setTyping } from '@/lib/typing';
import { findLatestUnansweredMessage, isBotTypingFor, markSeenIfDue } from '@/lib/demo/reply-engine';

// POST: I (userId) am typing to params.userId.
export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  setTyping(userId, params.userId);
  return NextResponse.json({ success: true });
}

// GET: is params.userId currently typing to me (userId)?
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const otherUser = await prisma.user.findUnique({ where: { id: params.userId }, select: { isDemoAccount: true } });
  if (otherUser?.isDemoAccount) {
    const unanswered = await findLatestUnansweredMessage(userId, params.userId);
    if (unanswered) await markSeenIfDue(unanswered);
    return NextResponse.json({ isTyping: unanswered ? isBotTypingFor(unanswered) : false });
  }

  return NextResponse.json({ isTyping: isTyping(params.userId, userId) });
}
