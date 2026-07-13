'use client';

import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PostList() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts();
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, Boolean(hasNextPage));

  if (isLoading) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (isError) {
    return <p className="py-6 text-center text-sm text-gray-500">Couldn&apos;t load the feed. Try refreshing.</p>;
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No posts yet — be the first to share something!</p>;
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} />
      {isFetchingNextPage ? <LoadingSpinner /> : null}
    </>
  );
}
