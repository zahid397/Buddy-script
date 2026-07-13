import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { eventId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) return errorResponse(404, 'Event not found');

  await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId: params.eventId, userId } },
    create: { eventId: params.eventId, userId },
    update: {},
  });

  // Notify the event creator that someone is going. Kept to the creator
  // only (not all attendees) to avoid a notification storm on popular events.
  await createNotification({ userId: event.createdById, actorId: userId, type: 'EVENT', eventId: event.id });

  const attendeeCount = await prisma.eventAttendee.count({ where: { eventId: params.eventId } });
  return NextResponse.json({ isGoing: true, attendeeCount });
}

export async function DELETE(request: NextRequest, { params }: { params: { eventId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.eventAttendee.deleteMany({ where: { eventId: params.eventId, userId } });

  const attendeeCount = await prisma.eventAttendee.count({ where: { eventId: params.eventId } });
  return NextResponse.json({ isGoing: false, attendeeCount });
}
