'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Pencil } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import FriendRequestButton from '../common/FriendRequestButton';
import FollowButton from '../common/FollowButton';
import EditProfileModal from './EditProfileModal';

export default function ProfileHeader({ userId }: { userId: string }) {
  const { data, isLoading } = useProfile(userId);
  const [editing, setEditing] = useState(false);

  if (isLoading || !data) {
    return <div className="bs-skeleton _b_radious6 mb-4 h-64 w-full" />;
  }

  const profile = data.profile;

  return (
    <div className="_feed_inner_area _b_radious6 mb-4 overflow-hidden bg-white">
      <div className="relative h-40 bg-gray-100 sm:h-48">
        {profile.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="px-4 pb-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-200 sm:-mt-12 sm:h-24 sm:w-24">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.firstName} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {profile.isMe ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <FriendRequestButton userId={profile.id} status={profile.friendshipStatus} requestId={profile.friendRequestId} />
                <FollowButton userId={profile.id} isFollowing={profile.isFollowedByMe} />
                <Link
                  href={`/messages/${profile.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  <MessageCircle size={14} /> Message
                </Link>
              </>
            )}
          </div>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-gray-900">
          {profile.firstName} {profile.lastName}
        </h2>
        {profile.bio ? <p className="mt-1 text-sm text-gray-600">{profile.bio}</p> : null}
        <div className="mt-3 flex gap-5 text-sm text-gray-500">
          <span>
            <strong className="text-gray-800">{profile.friendCount}</strong> Friends
          </span>
          <span>
            <strong className="text-gray-800">{profile.followerCount}</strong> Followers
          </span>
          <span>
            <strong className="text-gray-800">{profile.followingCount}</strong> Following
          </span>
        </div>
      </div>
      {editing ? <EditProfileModal profile={profile} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
