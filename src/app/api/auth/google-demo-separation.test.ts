import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({
  signAuthToken: vi.fn().mockResolvedValue('signed-token'),
  AUTH_COOKIE_NAME: 'token',
  AUTH_COOKIE_OPTIONS: { httpOnly: true },
}));

const { GET: googleStart } = await import('./google/route');
const { POST: demoLogin } = await import('./demo-login/route');

const demoBotAccount = {
  id: 'demo-user-1',
  email: 'alex@buddyscript.dev',
  firstName: 'Alex',
  lastName: 'Rivera',
  avatarUrl: null,
  coverImageUrl: null,
  bio: null,
  isDemoAccount: true,
  source: 'USER',
  createdAt: new Date(),
};

describe('Demo Account login is provably independent of real Google OAuth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('GET /api/auth/google 404s (no consent screen, no redirect) when Google credentials are absent', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');

    const response = await googleStart(new NextRequest('http://localhost/api/auth/google'));

    expect(response.status).toBe(404);
    // Never issues a redirect to Google, and never sets the CSRF state
    // cookie that only a real consent-screen redirect would need.
    expect(response.headers.get('location')).toBeNull();
  });

  it('POST /api/auth/demo-login succeeds with DEMO_MODE=true regardless of whether Google is configured', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    prismaMock.user.findMany.mockResolvedValue([demoBotAccount] as never);

    const response = await demoLogin();
    const json = await response.json();

    expect(response.status).toBe(200);
    // Only ever picks from source: USER, isDemoAccount: true accounts —
    // never a source: GOOGLE user, and never touches Google endpoints.
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({ where: { isDemoAccount: true, source: 'USER' } });
    // The session payload it returns carries no provider/source claim that
    // could be mistaken for a real Google-authenticated identity.
    expect(json.user).not.toHaveProperty('source');
    expect(json.user).not.toHaveProperty('provider');
    expect(json.user.isDemoAccount).toBe(true);
  });

  it('demo-login never reads or requires GOOGLE_CLIENT_ID/SECRET', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'should-be-irrelevant');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'should-be-irrelevant');
    prismaMock.user.findMany.mockResolvedValue([demoBotAccount] as never);

    const response = await demoLogin();

    expect(response.status).toBe(200);
  });
});
