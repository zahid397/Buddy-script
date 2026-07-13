import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import type { GroupDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const filter = request.nextUrl.searchParams.get('filter') === 'joined' ? 'joined' : 'discover';

  const groups = await prisma.group.findMany({
    where: filter === 'joined' ? { members: { some: { userId } } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { role: true } },
    },
  });

  const items: GroupDTO[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    coverImageUrl: g.coverImageUrl,
    memberCount: g._count.members,
    isMember: g.members.length > 0,
    role: g.members[0]?.role ?? null,
  }));

  return NextResponse.json({ items });
}
