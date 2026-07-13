'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import type { ReplyDTO } from '@/types';
import { timeAgo } from '@/lib/time';
import { ApiError } from '@/lib/api';
import { useDeleteReply, useLikeReply } from '@/hooks/useComments';
import LikeButton from '../common/LikeButton';
import LikesModal from '../common/LikesModal';

export default function ReplyItem({ commentId, reply }: { commentId: string; reply: ReplyDTO }) {
  const likeMutation = useLikeReply(commentId);
  const deleteMutation = useDeleteReply(commentId);
  const [showLikes, setShowLikes] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deleteMutation.mutateAsync(reply.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete reply');
    }
  };

  return (
    <div className="_comment_main" style={{ marginLeft: 32 }}>
      <div className="_comment_image">
        {reply.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reply.author.avatarUrl} alt={reply.author.firstName} className="_comment_img1" />
        ) : null}
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="_comment_name">
              <h4 className="_comment_name_title">
                {reply.author.firstName} {reply.author.lastName}
              </h4>
            </div>
            {reply.isMine ? (
              <button type="button" onClick={handleDelete} aria-label="Delete reply" className="text-gray-400 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            ) : null}
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{reply.content}</span>
            </p>
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <LikeButton
                    liked={reply.likedByMe}
                    count={reply.likeCount}
                    onToggle={() => likeMutation.mutate({ replyId: reply.id, liked: reply.likedByMe })}
                    onShowLikes={() => setShowLikes(true)}
                  />
                </li>
                <li>
                  <span className="_time_link">{timeAgo(reply.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {showLikes ? <LikesModal targetType="reply" targetId={reply.id} onClose={() => setShowLikes(false)} /> : null}
    </div>
  );
}
