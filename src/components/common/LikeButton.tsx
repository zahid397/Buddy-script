'use client';

import { Heart } from 'lucide-react';

export default function LikeButton({
  liked,
  count,
  onToggle,
  onShowLikes,
  disabled,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  onShowLikes?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`inline-flex items-center gap-1 text-sm font-medium ${liked ? 'text-brand' : 'text-gray-500'}`}
      >
        <Heart size={14} fill={liked ? '#1890FF' : 'none'} />
        {liked ? 'Liked' : 'Like'}
      </button>
      {count > 0 && onShowLikes ? (
        <button type="button" onClick={onShowLikes} className="text-xs text-gray-400 hover:underline">
          {count}
        </button>
      ) : count > 0 ? (
        <span className="text-xs text-gray-400">{count}</span>
      ) : null}
    </div>
  );
}
