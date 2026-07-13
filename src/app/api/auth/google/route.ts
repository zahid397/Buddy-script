import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/utils';
import { buildGoogleAuthUrl, GOOGLE_OAUTH_STATE_COOKIE, isGoogleOAuthConfigured } from '@/lib/googleOAuth';

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) return errorResponse(404, 'Not found');

  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

  const response = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
