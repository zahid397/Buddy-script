import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.dismissedSuggestion.upsert({
    where: { userId_dismissedId: { userId, dismissedId: params.userId } },
    create: { userId, dismissedId: params.userId },
    update: {},
  });

  return NextResponse.json({ success: true });
}
