import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { isDemoModeEnabled } from '@/lib/demo/config';
import { seedDemoPersonas } from '@/lib/demo/seed-personas';

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) return errorResponse(404, 'Not found');

  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const result = await seedDemoPersonas();
  return NextResponse.json(result);
}
