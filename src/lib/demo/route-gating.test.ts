import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return { ...actual, getAuthUserId: vi.fn().mockResolvedValue('user-1'), signAuthToken: vi.fn().mockResolvedValue('signed-token') };
});
vi.mock('@/lib/demo/demo-engine', () => ({ runDemoTick: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/demo/seed-personas', () => ({ seedDemoPersonas: vi.fn().mockResolvedValue({ personaCount: 14 }) }));

const { POST: tick } = await import('@/app/api/demo/tick/route');
const { POST: reset } = await import('@/app/api/demo/reset/route');
const { GET: status } = await import('@/app/api/demo/status/route');
const { POST: demoLogin } = await import('@/app/api/auth/demo-login/route');

function req(url: string) {
  return new NextRequest(url, { method: 'POST' });
}

describe('Demo-only routes 404 outside Demo Mode (never silently no-op)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('POST /api/demo/tick returns 404 when DEMO_MODE is not "true"', async () => {
    vi.stubEnv('DEMO_MODE', 'false');
    const response = await tick(req('http://localhost/api/demo/tick'));
    expect(response.status).toBe(404);
  });

  it('POST /api/demo/reset returns 404 when DEMO_MODE is unset', async () => {
    vi.stubEnv('DEMO_MODE', '');
    const response = await reset(req('http://localhost/api/demo/reset'));
    expect(response.status).toBe(404);
  });

  it('POST /api/auth/demo-login returns 404 when DEMO_MODE is not "true"', async () => {
    vi.stubEnv('DEMO_MODE', 'false');
    const response = await demoLogin();
    expect(response.status).toBe(404);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/demo/status always returns 200, reporting enabled: false rather than 404ing', async () => {
    vi.stubEnv('DEMO_MODE', 'false');
    const response = await status();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
  });
});

describe('Demo-only routes work normally when DEMO_MODE=true', () => {
  beforeEach(() => {
    vi.stubEnv('DEMO_MODE', 'true');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('POST /api/demo/tick proceeds past the gate (no 404)', async () => {
    const response = await tick(req('http://localhost/api/demo/tick'));
    expect(response.status).not.toBe(404);
  });

  it('GET /api/demo/status reports enabled: true', async () => {
    const response = await status();
    expect(await response.json()).toEqual({ enabled: true });
  });
});
