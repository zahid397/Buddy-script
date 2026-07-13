import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { changePasswordSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(404, 'User not found');

  if (user.source !== 'USER') {
    return errorResponse(400, 'Password changes are only available for email/password accounts.');
  }

  const currentMatches = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!currentMatches) return errorResponse(401, 'Current password is incorrect');

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

  return NextResponse.json({ success: true });
}
