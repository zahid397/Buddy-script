'use client';

import { useUserPosts } from '@/hooks/useProfile';
import PostCard from '../posts/PostCard';
import PostSkeleton from '../posts/PostSkeleton';

export default function ProfilePosts({ userId }: { userId: string }) {
  const { data, isLoading } = useUserPosts(userId);

  if (isLoading) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">No posts yet.</p>;
  }

  return (
    <>
      {data.items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}
