import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { signAuthToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { errorResponse, toPublicUser } from '@/lib/utils';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  if (isRateLimited(`login:${getClientIp(request)}`)) {
    return errorResponse(429, 'Too many requests. Please try again shortly.');
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return errorResponse(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return errorResponse(401, 'Invalid email or password');
  }

  const token = await signAuthToken(user.id);

  const response = NextResponse.json({ user: toPublicUser(user) });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
