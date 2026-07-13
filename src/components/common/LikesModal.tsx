'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LikeUserDTO } from '@/types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

export type LikeTargetType = 'post' | 'comment' | 'reply';

const ENDPOINT: Record<LikeTargetType, (id: string) => string> = {
  post: (id) => `/api/posts/${id}/likes`,
  comment: (id) => `/api/comments/${id}/likes`,
  reply: (id) => `/api/replies/${id}/likes`,
};

export default function LikesModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: LikeTargetType;
  targetId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['likes', targetType, targetId],
    queryFn: () => apiFetch<{ users: LikeUserDTO[] }>(ENDPOINT[targetType](targetId)),
  });

  return (
    <Modal title="Liked by" onClose={onClose}>
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.users.length ? (
        <p className="text-sm text-gray-500">No likes yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.users.map((u) => (
            <li key={u.id} className="flex items-center gap-3">
              {u.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatarUrl} alt={u.firstName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs text-white">
                  {u.firstName[0]}
                  {u.lastName[0]}
                </span>
              )}
              <span className="text-sm font-medium text-gray-800">
                {u.firstName} {u.lastName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
