import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

// jose (not jsonwebtoken) is used deliberately: Next.js middleware runs on the
// Edge runtime, which cannot use Node's `crypto` module that `jsonwebtoken`
// depends on. jose works on both Edge and Node, so middleware and API routes
// share one implementation instead of two.

export const AUTH_COOKIE_NAME = 'token';

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: AUTH_COOKIE_MAX_AGE,
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a string of at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== 'string') return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/** Reads and verifies the auth cookie on an API route request. Returns the
 * authenticated user's id, or null if missing/invalid. Every mutating route
 * calls this itself rather than relying solely on middleware, since
 * middleware only guards page navigation (see middleware.ts). */
export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await verifyAuthToken(token);
  return result?.userId ?? null;
}
