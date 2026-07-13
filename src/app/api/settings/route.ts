import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import type { SettingsDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(404, 'User not found');

  const settings: SettingsDTO = {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      location: user.location,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
    },
    account: {
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      source: user.source,
    },
    privacy: {
      profileVisibility: user.profileVisibility,
      defaultPostVisibility: user.defaultPostVisibility,
      whoCanSendFriendRequest: user.whoCanSendFriendRequest,
      whoCanMessage: user.whoCanMessage,
    },
    notifications: {
      notifyOnMessage: user.notifyOnMessage,
      notifyOnFriendRequest: user.notifyOnFriendRequest,
      notifyOnComment: user.notifyOnComment,
      notifyOnGroupActivity: user.notifyOnGroupActivity,
      notifyOnEvent: user.notifyOnEvent,
    },
    appearance: {
      themePreference: user.themePreference,
      feedDensity: user.feedDensity,
    },
  };

  return NextResponse.json(settings);
}
