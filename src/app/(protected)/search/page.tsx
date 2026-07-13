'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '@/hooks/useSearch';
import PostCard from '@/components/posts/PostCard';
import EventCard from '@/components/common/EventCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'users', label: 'People' },
  { key: 'posts', label: 'Posts' },
  { key: 'events', label: 'Events' },
] as const;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const { data, isLoading } = useSearch(q, tab);

  const noResults = data && data.users.length === 0 && data.posts.length === 0 && data.events.length === 0;

  return (
    <div className="_feed_inner_area _b_radious6 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-800">
        {q ? <>Search results for &quot;{q}&quot;</> : 'Search'}
      </h2>
      <div className="mt-3 flex gap-2 border-b border-gray-100 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!q ? <p className="py-6 text-center text-sm text-gray-400">Use the search bar above to find people, posts, or events.</p> : null}
      {isLoading ? <LoadingSpinner /> : null}

      {data ? (
        <div className="mt-4 space-y-6">
          {(tab === 'all' || tab === 'users') && data.users.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">People</h3>
              <div className="space-y-2">
                {data.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    className="flex items-center gap-3 rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt={u.firstName} className="h-10 w-10 rounded-full object-cover" />
                    ) : null}
                    <span className="text-sm font-medium text-gray-800">
                      {u.firstName} {u.lastName}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {(tab === 'all' || tab === 'posts') && data.posts.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">Posts</h3>
              {data.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </section>
          ) : null}

          {(tab === 'all' || tab === 'events') && data.events.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">Events</h3>
              <div className="space-y-3">
                {data.events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          ) : null}

          {q && noResults ? <p className="py-6 text-center text-sm text-gray-400">No results found.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
