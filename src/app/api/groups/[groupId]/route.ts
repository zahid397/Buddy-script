import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import type { GroupDTO } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { role: true } },
    },
  });
  if (!group) return errorResponse(404, 'Group not found');

  const dto: GroupDTO = {
    id: group.id,
    name: group.name,
    description: group.description,
    coverImageUrl: group.coverImageUrl,
    memberCount: group._count.members,
    isMember: group.members.length > 0,
    role: group.members[0]?.role ?? null,
  };

  return NextResponse.json({ group: dto });
}
