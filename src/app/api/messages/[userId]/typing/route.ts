import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { isTyping, setTyping } from '@/lib/typing';

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

  return NextResponse.json({ isTyping: isTyping(params.userId, userId) });
}
