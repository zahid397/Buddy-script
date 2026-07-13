import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const group = await prisma.group.findUnique({ where: { id: params.groupId } });
  if (!group) return errorResponse(404, 'Group not found');

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: params.groupId, userId } },
    update: {},
    create: { groupId: params.groupId, userId, role: 'MEMBER' },
  });

  if (group.createdById) {
    await createNotification({
      userId: group.createdById,
      actorId: userId,
      type: 'GROUP_JOIN',
      groupId: group.id,
    });
  }

  const memberCount = await prisma.groupMember.count({ where: { groupId: params.groupId } });
  return NextResponse.json({ isMember: true, memberCount });
}

export async function DELETE(request: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.groupMember.deleteMany({ where: { groupId: params.groupId, userId } });

  const memberCount = await prisma.groupMember.count({ where: { groupId: params.groupId } });
  return NextResponse.json({ isMember: false, memberCount });
}
