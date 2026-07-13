import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPublicUser } from '@/lib/utils';
import { updateProfileSchema } from '@/lib/validation';

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  return NextResponse.json({ user: toPublicUser(user) });
}
