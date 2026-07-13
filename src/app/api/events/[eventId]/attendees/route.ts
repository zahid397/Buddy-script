import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId: params.eventId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ items: attendees.map((a) => toPostAuthor(a.user)) });
}
