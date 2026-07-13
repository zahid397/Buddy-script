'use client';

import { useState, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import type { CommentDTO } from '@/types';
import { timeAgo } from '@/lib/time';
import { ApiError } from '@/lib/api';
import { useCreateReply, useDeleteComment, useLikeComment, useReplies } from '@/hooks/useComments';
import LikeButton from '../common/LikeButton';
import LikesModal from '../common/LikesModal';
import ReplyItem from './ReplyItem';

export default function CommentItem({ postId, comment }: { postId: string; comment: CommentDTO }) {
  const likeMutation = useLikeComment(postId);
  const deleteMutation = useDeleteComment(postId);
  const createReply = useCreateReply(comment.id);
  const [showReplies, setShowReplies] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const { data: repliesData, isLoading: repliesLoading } = useReplies(comment.id, showReplies);
  const replies = repliesData?.items ?? [];

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteMutation.mutateAsync(comment.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete comment');
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim() || replySubmitting) return;
    setReplySubmitting(true);
    try {
      await createReply.mutateAsync(replyContent.trim());
      setReplyContent('');
      setShowReplies(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReplyKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitReply();
    }
  };

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        {comment.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.author.avatarUrl} alt={comment.author.firstName} className="_comment_img1" />
        ) : null}
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="_comment_name">
              <h4 className="_comment_name_title">
                {comment.author.firstName} {comment.author.lastName}
              </h4>
            </div>
            {comment.isMine ? (
              <button type="button" onClick={handleDelete} aria-label="Delete comment" className="text-gray-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            ) : null}
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.content}</span>
            </p>
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <LikeButton
                    liked={comment.likedByMe}
                    count={comment.likeCount}
                    onToggle={() => likeMutation.mutate({ commentId: comment.id, liked: comment.likedByMe })}
                    onShowLikes={() => setShowLikes(true)}
                  />
                </li>
                <li>
                  <button type="button" onClick={() => setShowReplies((v) => !v)}>
                    Reply{comment.replyCount > 0 ? ` (${comment.replyCount})` : ''}
                  </button>
                </li>
                <li>
                  <span className="_time_link">{timeAgo(comment.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {showReplies ? (
          <div style={{ marginTop: 10 }}>
            {repliesLoading ? <p className="text-xs text-gray-400">Loading replies…</p> : null}
            {replies.map((reply) => (
              <ReplyItem key={reply.id} commentId={comment.id} reply={reply} />
            ))}
            <div className="_feed_inner_comment_box" style={{ marginTop: 8, marginLeft: 32 }}>
              <div className="_feed_inner_comment_box_content">
                <div className="_feed_inner_comment_box_content_txt" style={{ marginLeft: 0 }}>
                  <textarea
                    className="form-control _comment_textarea"
                    placeholder="Write a reply"
                    rows={1}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    disabled={replySubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showLikes ? <LikesModal targetType="comment" targetId={comment.id} onClose={() => setShowLikes(false)} /> : null}
    </div>
  );
}
