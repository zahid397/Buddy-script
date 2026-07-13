import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, signAuthToken } from '@/lib/auth';
import { errorResponse, toPublicUser } from '@/lib/utils';
import { isDemoModeEnabled } from '@/lib/demo/config';

// Signs in as one of the 5 login-capable demo accounts (source: USER,
// isDemoAccount: true) — never a DEMO_BOT persona, which are NPCs the demo
// engine acts as and are never meant to be logged into directly. This is
// explicitly NOT Google auth: no consent screen, no Google credentials
// touched, clearly labeled in the UI as "Continue with Demo Account".
export async function POST() {
  if (!isDemoModeEnabled()) return errorResponse(404, 'Not found');

  const demoAccounts = await prisma.user.findMany({ where: { isDemoAccount: true, source: 'USER' } });
  if (demoAccounts.length === 0) {
    return errorResponse(500, 'No demo accounts are seeded yet. Run `npm run db:seed` first.');
  }

  const user = demoAccounts[Math.floor(Math.random() * demoAccounts.length)];
  const token = await signAuthToken(user.id);

  const response = NextResponse.json({ user: toPublicUser(user) });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}
