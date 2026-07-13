'use client';

import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useAcceptFriendRequest, useIncomingFriendRequests, useRejectFriendRequest } from '@/hooks/useFriends';
import { ApiError } from '@/lib/api';

export default function FriendRequestsPanel() {
  const { data, isLoading } = useIncomingFriendRequests();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const requests = data?.items ?? [];
  if (isLoading || requests.length === 0) return null;

  const handleAccept = async (id: string, name: string) => {
    try {
      await accept.mutateAsync(id);
      toast.success(`You and ${name} are now friends`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject.mutateAsync(id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reject request');
    }
  };

  return (
    <div className="_layout_left_sidebar_inner">
      <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <div className="_left_inner_area_suggest_content _mar_b24">
          <h4 className="_left_inner_area_suggest_content_title _title5">Friend Requests</h4>
        </div>
        {requests.map((r) => (
          <div className="_left_inner_area_suggest_info" key={r.id}>
            <div className="_left_inner_area_suggest_info_box">
              <div className="_left_inner_area_suggest_info_image">
                {r.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.user.avatarUrl} alt={r.user.firstName} className="_info_img" />
                ) : null}
              </div>
              <div className="_left_inner_area_suggest_info_txt">
                <h4 className="_left_inner_area_suggest_info_title">
                  {r.user.firstName} {r.user.lastName}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAccept(r.id, r.user.firstName)}
                className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-hover"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleReject(r.id)}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
