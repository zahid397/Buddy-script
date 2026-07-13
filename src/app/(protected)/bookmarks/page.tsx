'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useSavedPosts } from '@/hooks/useBookmarks';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from '@/components/posts/PostCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function BookmarksPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSavedPosts();
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, Boolean(hasNextPage));

  const saved = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Saved Posts</h2>
        <p className="mt-1 text-xs text-gray-400">Posts you've bookmarked to read again later.</p>
      </div>

      {isLoading ? <LoadingSpinner /> : null}

      {!isLoading && saved.length === 0 ? (
        <div className="_feed_inner_area _b_radious6 flex flex-col items-center gap-2 bg-white px-5 py-16 text-center">
          <Bookmark size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">No saved posts yet.</p>
          <p className="text-xs text-gray-400">
            Tap <span className="font-medium">Save</span> on any post in your{' '}
            <Link href="/feed" className="text-brand hover:underline">
              feed
            </Link>{' '}
            to bookmark it here.
          </p>
        </div>
      ) : null}

      {saved.map(({ id, post }) => (
        <PostCard key={id} post={post} />
      ))}

      <div ref={sentinelRef} />
      {isFetchingNextPage ? <LoadingSpinner /> : null}
    </div>
  );
}
