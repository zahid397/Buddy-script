import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { deleteFriendshipPair } from '@/lib/social';

export async function DELETE(request: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await deleteFriendshipPair(userId, params.friendId);

  return NextResponse.json({ success: true });
}
