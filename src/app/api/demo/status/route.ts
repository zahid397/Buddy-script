import { NextResponse } from 'next/server';
import { isDemoModeEnabled } from '@/lib/demo/config';

// Deliberately always 200 (unlike the other /api/demo/* routes) — this is
// the read-only check the client hook uses to decide whether to poll tick
// at all, so it can't itself 404 when disabled without defeating its purpose.
export async function GET() {
  return NextResponse.json({ enabled: isDemoModeEnabled() });
}
