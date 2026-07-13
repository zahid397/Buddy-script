import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

// Handles both "reject an incoming request" (receiver) and "cancel my
// outgoing request" (sender) — both just remove the pending row.
export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const friendRequest = await prisma.friendRequest.findUnique({ where: { id: params.requestId } });
  if (!friendRequest || (friendRequest.receiverId !== userId && friendRequest.senderId !== userId)) {
    return errorResponse(404, 'Friend request not found');
  }

  await prisma.friendRequest.delete({ where: { id: friendRequest.id } });

  return NextResponse.json({ success: true });
}
