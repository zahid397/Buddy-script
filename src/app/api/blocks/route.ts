import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: blocks.map((b) => toPostAuthor(b.blocked)) });
}
