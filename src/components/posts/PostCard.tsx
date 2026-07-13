'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Globe, Heart, Lock, MessageCircle, MoreHorizontal, Share2, Trash2, Users } from 'lucide-react';
import type { PostDTO } from '@/types';
import { useDeletePost, useLikePost, useSharePost } from '@/hooks/usePosts';
import { timeAgo } from '@/lib/time';
import { ApiError } from '@/lib/api';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import BlurImage from '../common/BlurImage';
import ImageLightbox from '../common/ImageLightbox';
import LikesModal from '../common/LikesModal';
import CommentSection from '../comments/CommentSection';

const VISIBILITY_META = {
  PUBLIC: { label: 'Public', icon: Globe },
  FRIENDS: { label: 'Friends', icon: Users },
  PRIVATE: { label: 'Only me', icon: Lock },
} as const;

export default function PostCard({ post }: { post: PostDTO }) {
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();
  const shareMutation = useSharePost();
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  const VisibilityIcon = VISIBILITY_META[post.visibility].icon;

  const handleLike = () => {
    likeMutation.mutate({ postId: post.id, liked: post.likedByMe });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteMutation.mutateAsync(post.id);
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete post');
    }
  };

  const handleShare = async () => {
    try {
      await shareMutation.mutateAsync({ postId: post.id });
      setShareCount((c) => c + 1);
      toast.success('Shared to your timeline');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to share post');
    }
  };

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatarUrl} alt={post.author.firstName} className="_post_img" />
              ) : null}
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {post.author.firstName} {post.author.lastName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(post.createdAt)} ·{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <VisibilityIcon size={11} /> {VISIBILITY_META[post.visibility].label}
                </span>
              </p>
            </div>
          </div>
          {post.isMine ? (
            <div className="_feed_inner_timeline_post_box_dropdown" ref={menuRef}>
              <div className="_feed_timeline_post_dropdown">
                <button type="button" className="_feed_timeline_post_dropdown_link" onClick={() => setMenuOpen((v) => !v)}>
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className={`_feed_timeline_dropdown _timeline_dropdown${menuOpen ? ' show' : ''}`}>
                <ul className="_feed_timeline_dropdown_list">
                  <li className="_feed_timeline_dropdown_item">
                    <button type="button" className="_feed_timeline_dropdown_link" onClick={handleDelete}>
                      <Trash2 size={14} style={{ marginRight: 6, display: 'inline' }} /> Delete Post
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
        {post.content ? <h4 className="_feed_inner_timeline_post_title">{post.content}</h4> : null}
        {post.imageUrl ? (
          <div className="_feed_inner_timeline_image">
            <BlurImage
              src={post.imageUrl}
              blurHash={post.imageBlurHash}
              alt="Post attachment"
              className="_time_img cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />
          </div>
        ) : null}
        {post.sharedFrom ? (
          <div className="rounded-card border border-gray-200 p-3 mt-2">
            <div className="flex items-center gap-2">
              {post.sharedFrom.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.sharedFrom.author.avatarUrl} alt={post.sharedFrom.author.firstName} className="h-8 w-8 rounded-full object-cover" />
              ) : null}
              <div>
                <Link href={`/profile/${post.sharedFrom.author.id}`} className="text-sm font-semibold text-gray-800 hover:underline">
                  {post.sharedFrom.author.firstName} {post.sharedFrom.author.lastName}
                </Link>
                <p className="text-xs text-gray-400">{timeAgo(post.sharedFrom.createdAt)}</p>
              </div>
            </div>
            {post.sharedFrom.content ? <p className="mt-2 text-sm text-gray-700">{post.sharedFrom.content}</p> : null}
            {post.sharedFrom.imageUrl ? (
              <BlurImage
                src={post.sharedFrom.imageUrl}
                blurHash={post.sharedFrom.imageBlurHash}
                alt="Shared post attachment"
                className="mt-2 rounded-card"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {post.likeCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowLikes(true)}
              className="_feed_inner_timeline_total_reacts_para"
              style={{ background: 'none', border: 0 }}
            >
              {post.likeCount} like{post.likeCount === 1 ? '' : 's'}
            </button>
          ) : null}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button type="button" onClick={() => setShowComments((v) => !v)} style={{ background: 'none', border: 0 }}>
              <span>{post.commentCount}</span> Comment
            </button>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <button type="button" onClick={handleShare} disabled={shareMutation.isPending} style={{ background: 'none', border: 0 }}>
              <span>{shareCount}</span> Share
            </button>
          </p>
        </div>
      </div>

      <div className="_feed_inner_timeline_reaction">
        <button
          type="button"
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${post.likedByMe ? ' _feed_reaction_active' : ''}`}
          onClick={handleLike}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <Heart size={16} fill={post.likedByMe ? '#1890FF' : 'none'} /> {post.likedByMe ? 'Liked' : 'Like'}
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={() => setShowComments((v) => !v)}>
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <MessageCircle size={16} /> Comment
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_share _feed_reaction" onClick={handleShare} disabled={shareMutation.isPending}>
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <Share2 size={16} /> Share
            </span>
          </span>
        </button>
      </div>

      {showComments ? <CommentSection postId={post.id} /> : null}
      {showLikes ? <LikesModal targetType="post" targetId={post.id} onClose={() => setShowLikes(false)} /> : null}
      {showLightbox && post.imageUrl ? (
        <ImageLightbox src={post.imageUrl} alt="Post attachment" onClose={() => setShowLightbox(false)} />
      ) : null}
    </div>
  );
}
