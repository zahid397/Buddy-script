import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { isDemoModeEnabled } from '@/lib/demo/config';
import { runDemoTick } from '@/lib/demo/demo-engine';
import { isRateLimited } from '@/lib/rateLimit';

const TICK_BUCKET_MS = 20_000;

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) return errorResponse(404, 'Not found');

  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  if (isRateLimited(`demo-tick:${userId}`)) {
    return errorResponse(429, 'Too many requests');
  }

  const bucket = Math.floor(Date.now() / TICK_BUCKET_MS);
  const idempotencyKey = `${userId}:${bucket}`;

  const result = await runDemoTick(userId, idempotencyKey);

  return NextResponse.json({ event: result?.event ?? null });
}
