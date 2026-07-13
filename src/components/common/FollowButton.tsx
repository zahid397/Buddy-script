'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { ApiError } from '@/lib/api';

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  variant = 'default',
}: {
  userId: string;
  isFollowing: boolean;
  variant?: 'default' | 'sidebar';
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [hovering, setHovering] = useState(false);
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const busy = follow.isPending || unfollow.isPending;

  const handleClick = async () => {
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(userId);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await follow.mutateAsync(userId);
        setIsFollowing(true);
        toast.success('Following!');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  const label = isFollowing ? (hovering ? 'Unfollow' : 'Following') : 'Follow';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={busy}
        className={`_right_info_btn_link${isFollowing && !hovering ? ' _right_info_btn_link_active' : ''}`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={busy}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
        isFollowing
          ? hovering
            ? 'bg-red-50 text-red-600'
            : 'bg-gray-100 text-gray-700'
          : 'bg-brand text-white hover:bg-brand-hover'
      }`}
    >
      {label}
    </button>
  );
}
