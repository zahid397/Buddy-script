'use client';

import {
  Bookmark,
  Calendar,
  Heart,
  MessageCircle,
  MessageSquare,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PostCard from '@/components/posts/PostCard';

const STAT_ICONS = {
  totalPosts: MessageSquare,
  totalLikesReceived: Heart,
  totalCommentsReceived: MessageCircle,
  friendsCount: Users,
  followersCount: UserCheck,
  savedPostsCount: Bookmark,
  messagesSent: Send,
  eventsJoined: Calendar,
} as const;

function StatCard({ icon: Icon, label, value }: { icon: (typeof STAT_ICONS)[keyof typeof STAT_ICONS]; label: string; value: number }) {
  return (
    <div className="_feed_inner_area _b_radious6 flex items-center gap-3 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-lg font-semibold text-gray-800">{value}</span>
        <span className="block text-xs text-gray-400">{label}</span>
      </span>
    </div>
  );
}

function WeeklyActivityChart({ data }: { data: { date: string; posts: number; likes: number; comments: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.posts + d.likes + d.comments));
  return (
    <div className="_feed_inner_area _b_radious6 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700">7-day activity</h3>
      <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 140 }}>
        {data.map((d) => {
          const total = d.posts + d.likes + d.comments;
          const heightPct = Math.max(4, (total / max) * 100);
          const weekday = new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t-md bg-brand transition-all"
                  style={{ height: `${heightPct}%` }}
                  title={`${total} activity on ${d.date}`}
                />
              </div>
              <span className="text-[10px] text-gray-400">{weekday}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EngagementBreakdown({ likes, comments, posts }: { likes: number; comments: number; posts: number }) {
  const total = Math.max(1, likes + comments + posts);
  const segments = [
    { label: 'Likes', value: likes, color: '#1890FF' },
    { label: 'Comments', value: comments, color: '#00ACFF' },
    { label: 'Posts', value: posts, color: '#8DD3FF' },
  ];
  return (
    <div className="_feed_inner_area _b_radious6 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700">Engagement breakdown</h3>
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { data, isLoading } = useInsights();

  if (isLoading || !data) {
    return (
      <div className="_feed_inner_area _b_radious6 bg-white p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const weekTotals = data.weeklyActivity.reduce(
    (acc, d) => ({ posts: acc.posts + d.posts, likes: acc.likes + d.likes, comments: acc.comments + d.comments }),
    { posts: 0, likes: 0, comments: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="_feed_inner_area _b_radious6 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Insights</h2>
        <p className="mt-1 text-xs text-gray-400">A real-time snapshot of your activity on Buddy Script.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={STAT_ICONS.totalPosts} label="Posts" value={data.totalPosts} />
        <StatCard icon={STAT_ICONS.totalLikesReceived} label="Likes received" value={data.totalLikesReceived} />
        <StatCard icon={STAT_ICONS.totalCommentsReceived} label="Comments received" value={data.totalCommentsReceived} />
        <StatCard icon={STAT_ICONS.friendsCount} label="Friends" value={data.friendsCount} />
        <StatCard icon={STAT_ICONS.followersCount} label="Followers" value={data.followersCount} />
        <StatCard icon={STAT_ICONS.savedPostsCount} label="Saved posts" value={data.savedPostsCount} />
        <StatCard icon={STAT_ICONS.messagesSent} label="Messages sent" value={data.messagesSent} />
        <StatCard icon={STAT_ICONS.eventsJoined} label="Events joined" value={data.eventsJoined} />
      </div>

      <WeeklyActivityChart data={data.weeklyActivity} />
      <EngagementBreakdown likes={weekTotals.likes} comments={weekTotals.comments} posts={weekTotals.posts} />

      <div className="_feed_inner_area _b_radious6 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700">Profile completion</h3>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${data.profileCompletionPercent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-400">{data.profileCompletionPercent}% complete</p>
      </div>

      {data.topPost ? (
        <div>
          <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">Top-performing post</h3>
          <PostCard post={data.topPost} />
        </div>
      ) : null}
    </div>
  );
}
