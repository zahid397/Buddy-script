import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, signAuthToken } from '@/lib/auth';
import { exchangeGoogleCode, GOOGLE_OAUTH_STATE_COOKIE, isGoogleOAuthConfigured } from '@/lib/googleOAuth';
import { errorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) return errorResponse(404, 'Not found');

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  try {
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
    const profile = await exchangeGoogleCode(code, redirectUri);

    if (!profile.email) throw new Error('Google profile had no email');
    const email = profile.email.toLowerCase();

    // If an account with this email already exists (password-based or a
    // prior Google login), sign into it as-is — this is standard OAuth
    // account linking, and we never overwrite an existing profile's name
    // or avatar just because they logged in with Google this time.
    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email,
          firstName: profile.given_name || 'Google',
          lastName: profile.family_name || 'User',
          avatarUrl: profile.picture || null,
          password: await bcrypt.hash(crypto.randomUUID(), 10),
          source: 'GOOGLE',
        },
      }));

    const token = await signAuthToken(user.id);
    const response = NextResponse.redirect(new URL('/feed', request.url));
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
  } catch (err) {
    console.error('Google OAuth callback failed', err);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
