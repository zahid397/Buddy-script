'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { ApiError } from '@/lib/api';
import LoadingSpinner from '../common/LoadingSpinner';
import CommentItem from './CommentItem';

export default function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(postId);
  const createComment = useCreateComment(postId);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const comments = (data?.pages.flatMap((p) => p.items) ?? []).slice().reverse();

  const submitComment = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createComment.mutateAsync(content.trim());
      setContent('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  return (
    <div className="_padd_r24 _padd_l24" style={{ marginTop: 16 }}>
      <div className="_feed_inner_comment_box">
        <form className="_feed_inner_comment_box_form" onSubmit={handleSubmit}>
          <div className="_feed_inner_comment_box_content">
            <div className="_feed_inner_comment_box_content_image">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.firstName} className="_comment_img" />
              ) : null}
            </div>
            <div className="_feed_inner_comment_box_content_txt">
              <textarea
                className="form-control _comment_textarea"
                placeholder="Write a comment"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={submitting}
              />
            </div>
          </div>
        </form>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="_timline_comment_main">
          {hasNextPage ? (
            <div className="_previous_comment">
              <button
                type="button"
                className="_previous_comment_txt"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading…' : 'View previous comments'}
              </button>
            </div>
          ) : null}
          {comments.map((comment) => (
            <CommentItem key={comment.id} postId={postId} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
