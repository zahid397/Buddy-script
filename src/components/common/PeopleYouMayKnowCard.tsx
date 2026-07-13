'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { MessageCircle, Users } from 'lucide-react';
import type { SuggestedUserDTO } from '@/types';
import { useDismissSuggestion } from '@/hooks/useFollow';
import { ApiError } from '@/lib/api';
import FriendRequestButton from './FriendRequestButton';

export default function PeopleYouMayKnowCard({
  person,
  onDismiss,
}: {
  person: SuggestedUserDTO;
  onDismiss: (userId: string) => void;
}) {
  const dismiss = useDismissSuggestion();

  const handleIgnore = async () => {
    onDismiss(person.id);
    try {
      await dismiss.mutateAsync(person.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to dismiss suggestion');
    }
  };

  return (
    <div className="_left_inner_area_suggest_info">
      <div className="_left_inner_area_suggest_info_box">
        <div className="_left_inner_area_suggest_info_image">
          <Link href={`/profile/${person.id}`}>
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt={person.firstName} className="_info_img" />
            ) : null}
          </Link>
        </div>
        <div className="_left_inner_area_suggest_info_txt">
          <Link href={`/profile/${person.id}`}>
            <h4 className="_left_inner_area_suggest_info_title">
              {person.firstName} {person.lastName}
            </h4>
          </Link>
          {person.bio ? (
            <p className="_left_inner_area_suggest_info_para" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {person.bio}
            </p>
          ) : null}
          {person.mutualFriendCount > 0 ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <Users size={11} /> {person.mutualFriendCount} mutual friend{person.mutualFriendCount === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {person.friendshipStatus === 'FRIENDS' ? (
          <Link
            href={`/messages/${person.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            <MessageCircle size={13} /> Message
          </Link>
        ) : (
          <FriendRequestButton userId={person.id} status={person.friendshipStatus} requestId={person.friendRequestId} compact />
        )}
        {person.friendshipStatus === 'NONE' ? (
          <button type="button" onClick={handleIgnore} className="text-xs text-gray-400 hover:text-gray-600">
            Ignore
          </button>
        ) : null}
      </div>
    </div>
  );
}
