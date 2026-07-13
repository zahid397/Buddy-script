'use client';

import { useMarkAllNotificationsRead, useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import NotificationItem from '@/components/common/NotificationItem';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function NotificationsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const { data: unread } = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, Boolean(hasNextPage));

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Notifications</h2>
        {unread && unread.count > 0 ? (
          <button type="button" onClick={() => markAllRead.mutate()} className="text-xs font-medium text-brand hover:underline">
            Mark all as read
          </button>
        ) : null}
      </div>

      {isLoading ? <LoadingSpinner /> : null}
      {!isLoading && notifications.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">You&apos;re all caught up.</p>
      ) : null}

      <div className="divide-y divide-gray-50">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>

      <div ref={sentinelRef} />
      {isFetchingNextPage ? <LoadingSpinner /> : null}
    </div>
  );
}
