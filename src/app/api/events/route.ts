import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { eventInclude, toEventDTO } from '@/lib/dto';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 20), 50);

  const events = await prisma.event.findMany({
    orderBy: { eventDate: 'asc' },
    take: limit,
    include: eventInclude(userId),
  });

  return NextResponse.json({ items: events.map(toEventDTO) });
}
