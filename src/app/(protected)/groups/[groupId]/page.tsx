'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Users2 } from 'lucide-react';
import { useCreateGroupPost, useGroup, useGroupPosts, useJoinGroup, useLeaveGroup } from '@/hooks/useGroups';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { ApiError } from '@/lib/api';
import { timeAgo } from '@/lib/time';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, isLoading } = useGroup(groupId);
  const { data: postsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGroupPosts(groupId);
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const createPost = useCreateGroupPost(groupId);
  const [content, setContent] = useState('');
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, Boolean(hasNextPage));

  const group = data?.group;
  const posts = postsData?.pages.flatMap((p) => p.items) ?? [];

  const handleToggleMembership = async () => {
    if (!group) return;
    try {
      if (group.isMember) {
        await leave.mutateAsync(group.id);
        toast.success('Left group');
      } else {
        await join.mutateAsync(group.id);
        toast.success('Joined group');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update membership');
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync(content.trim());
      setContent('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to post');
    }
  };

  if (isLoading || !group) {
    return (
      <div className="_feed_inner_area _b_radious6 bg-white p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 overflow-hidden bg-white">
        {group.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.coverImageUrl} alt={group.name} className="h-36 w-full object-cover" />
        ) : null}
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-800">{group.name}</h2>
          {group.description ? <p className="mt-1 text-sm text-gray-500">{group.description}</p> : null}
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Users2 size={12} /> {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={handleToggleMembership}
            disabled={join.isPending || leave.isPending}
            className={`mt-3 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              group.isMember ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-brand text-white'
            }`}
          >
            {group.isMember ? 'Leave Group' : 'Join Group'}
          </button>
        </div>
      </div>

      {group.isMember ? (
        <div className="_feed_inner_area _b_radious6 mb-4 bg-white p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder={`Share something with ${group.name}…`}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={handlePost}
            disabled={createPost.isPending || !content.trim()}
            className="mt-2 rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {createPost.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="_feed_inner_area _b_radious6 flex flex-col items-center gap-2 bg-white px-5 py-16 text-center">
          <MessageSquare size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">No posts in this group yet.</p>
        </div>
      ) : null}

      {posts.map((post) => (
        <div key={post.id} className="_feed_inner_area _b_radious6 mb-3 bg-white p-4">
          <div className="flex items-center gap-2.5">
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.avatarUrl} alt={post.author.firstName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {post.author.firstName[0]}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {post.author.firstName} {post.author.lastName}
              </p>
              <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-700">{post.content}</p>
        </div>
      ))}

      <div ref={sentinelRef} />
      {isFetchingNextPage ? <LoadingSpinner /> : null}
    </div>
  );
}
