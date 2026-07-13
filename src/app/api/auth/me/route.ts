import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPublicUser } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(401, 'Not authenticated');

  return NextResponse.json({ user: toPublicUser(user) });
}
