'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, UserX, Users } from 'lucide-react';
import {
  useFriends,
  useIncomingFriendRequests,
  useOutgoingFriendRequests,
} from '@/hooks/useFriends';
import { useUserSuggestions } from '@/hooks/useFollow';
import { useSearch } from '@/hooks/useSearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { FriendshipStatus, PostAuthor } from '@/types';
import FriendRequestButton from '@/components/common/FriendRequestButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TABS = [
  { key: 'suggestions', label: 'People You May Know' },
  { key: 'search', label: 'Search' },
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function PersonRow({
  person,
  bio,
  mutualFriendCount,
  status,
  requestId,
}: {
  person: PostAuthor;
  bio?: string | null;
  mutualFriendCount?: number;
  status: FriendshipStatus;
  requestId: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-3 last:border-0">
      <Link href={`/profile/${person.id}`} className="flex min-w-0 items-center gap-3">
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatarUrl} alt={person.firstName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {person.firstName[0]}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-800">
            {person.firstName} {person.lastName}
          </span>
          {bio ? <span className="block truncate text-xs text-gray-400">{bio}</span> : null}
          {mutualFriendCount ? (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <Users size={11} /> {mutualFriendCount} mutual friend{mutualFriendCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="shrink-0">
        <FriendRequestButton userId={person.id} status={status} requestId={requestId} />
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState<TabKey>('suggestions');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: suggestions, isLoading: suggestionsLoading } = useUserSuggestions('friends', 20);
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: incoming, isLoading: incomingLoading } = useIncomingFriendRequests();
  const { data: outgoing, isLoading: outgoingLoading } = useOutgoingFriendRequests();
  const { data: searchResults, isLoading: searchLoading } = useSearch(debouncedQuery, 'users');

  const friendIds = useMemo(() => new Set((friends?.items ?? []).map((f) => f.id)), [friends]);
  const incomingByUser = useMemo(
    () => new Map((incoming?.items ?? []).map((r) => [r.user.id, r.id])),
    [incoming]
  );
  const outgoingByUser = useMemo(
    () => new Map((outgoing?.items ?? []).map((r) => [r.user.id, r.id])),
    [outgoing]
  );

  const statusFor = (userId: string): { status: FriendshipStatus; requestId: string | null } => {
    if (friendIds.has(userId)) return { status: 'FRIENDS', requestId: null };
    if (incomingByUser.has(userId)) return { status: 'REQUEST_RECEIVED', requestId: incomingByUser.get(userId) ?? null };
    if (outgoingByUser.has(userId)) return { status: 'REQUEST_SENT', requestId: outgoingByUser.get(userId) ?? null };
    return { status: 'NONE', requestId: null };
  };

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Find Friends</h2>
        <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
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
              {t.key === 'requests' && incoming && incoming.items.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {incoming.items.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === 'suggestions' ? (
        <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
          {suggestionsLoading ? <LoadingSpinner /> : null}
          {!suggestionsLoading && (suggestions?.items.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No suggestions right now — check back later.</p>
          ) : null}
          {suggestions?.items.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              bio={person.bio}
              mutualFriendCount={person.mutualFriendCount}
              status={person.friendshipStatus}
              requestId={person.friendRequestId}
            />
          ))}
        </div>
      ) : null}

      {tab === 'search' ? (
        <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people by name…"
                className="w-full border-0 text-sm outline-none"
              />
            </div>
          </div>
          {searchLoading ? <LoadingSpinner /> : null}
          {debouncedQuery && !searchLoading && (searchResults?.users.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No people found for &quot;{debouncedQuery}&quot;.</p>
          ) : null}
          {!debouncedQuery ? <p className="px-5 py-8 text-center text-sm text-gray-400">Start typing to search for people.</p> : null}
          {searchResults?.users.map((person) => {
            const { status, requestId } = statusFor(person.id);
            return <PersonRow key={person.id} person={person} status={status} requestId={requestId} />;
          })}
        </div>
      ) : null}

      {tab === 'friends' ? (
        <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
          {friendsLoading ? <LoadingSpinner /> : null}
          {!friendsLoading && (friends?.items.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">You haven&apos;t added any friends yet.</p>
          ) : null}
          {friends?.items.map((person) => (
            <PersonRow key={person.id} person={person} status="FRIENDS" requestId={null} />
          ))}
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div className="space-y-4">
          <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
            <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">Incoming Requests</h3>
            {incomingLoading ? <LoadingSpinner /> : null}
            {!incomingLoading && (incoming?.items.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No incoming friend requests.</p>
            ) : null}
            {incoming?.items.map((r) => (
              <PersonRow key={r.id} person={r.user} status="REQUEST_RECEIVED" requestId={r.id} />
            ))}
          </div>
          <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
            <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">Sent Requests</h3>
            {outgoingLoading ? <LoadingSpinner /> : null}
            {!outgoingLoading && (outgoing?.items.length ?? 0) === 0 ? (
              <p className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-gray-400">
                <UserX size={14} /> No pending sent requests.
              </p>
            ) : null}
            {outgoing?.items.map((r) => (
              <PersonRow key={r.id} person={r.user} status="REQUEST_SENT" requestId={r.id} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
