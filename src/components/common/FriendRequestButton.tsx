'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserCheck, UserPlus, UserX, Check, X } from 'lucide-react';
import type { FriendshipStatus } from '@/types';
import { useAcceptFriendRequest, useRejectFriendRequest, useSendFriendRequest, useUnfriend } from '@/hooks/useFriends';
import { ApiError } from '@/lib/api';

export default function FriendRequestButton({
  userId,
  status,
  requestId,
  compact = false,
}: {
  userId: string;
  status: FriendshipStatus;
  requestId: string | null;
  compact?: boolean;
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localRequestId, setLocalRequestId] = useState(requestId);
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();
  const unfriend = useUnfriend();

  const handleSend = async () => {
    try {
      const res = await send.mutateAsync(userId);
      if (res.status === 'FRIENDS') {
        setLocalStatus('FRIENDS');
        toast.success("You're now friends!");
      } else {
        setLocalStatus('REQUEST_SENT');
        setLocalRequestId(res.id ?? null);
        toast.success('Friend request sent');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send friend request');
    }
  };

  const handleAccept = async () => {
    if (!localRequestId) return;
    try {
      await accept.mutateAsync(localRequestId);
      setLocalStatus('FRIENDS');
      toast.success("You're now friends!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept request');
    }
  };

  const handleReject = async () => {
    if (!localRequestId) return;
    try {
      await reject.mutateAsync(localRequestId);
      setLocalStatus('NONE');
      setLocalRequestId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reject request');
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await unfriend.mutateAsync(userId);
      setLocalStatus('NONE');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove friend');
    }
  };

  const busy = send.isPending || accept.isPending || reject.isPending || unfriend.isPending;

  if (localStatus === 'FRIENDS') {
    return (
      <button
        type="button"
        onClick={handleUnfriend}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
        title="Remove friend"
      >
        <UserCheck size={14} /> {compact ? '' : 'Friends'}
      </button>
    );
  }

  if (localStatus === 'REQUEST_RECEIVED') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
        >
          <Check size={14} /> Accept
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          <X size={14} /> Reject
        </button>
      </div>
    );
  }

  if (localStatus === 'REQUEST_SENT') {
    return (
      <button
        type="button"
        onClick={handleReject}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
      >
        <UserX size={14} /> Cancel Request
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-60"
    >
      <UserPlus size={14} /> Add Friend
    </button>
  );
}
