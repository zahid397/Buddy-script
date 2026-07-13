import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.message.updateMany({
    where: { senderId: params.userId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
