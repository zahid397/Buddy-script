'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useConversations } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { timeAgo } from '@/lib/time';

export default function ConversationList({ activeUserId }: { activeUserId?: string }) {
  const { data: conversations, isLoading } = useConversations();
  const { data: friendsData } = useFriends();
  const [query, setQuery] = useState('');

  const conversationUserIds = useMemo(
    () => new Set((conversations?.items ?? []).map((c) => c.user.id)),
    [conversations]
  );

  const friendResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (friendsData?.items ?? [])
      .filter((f) => !conversationUserIds.has(f.id))
      .filter((f) => `${f.firstName} ${f.lastName}`.toLowerCase().includes(q));
  }, [friendsData, query, conversationUserIds]);

  return (
    <div className="flex h-full w-full flex-col md:w-72 md:border-r md:border-gray-100">
      <div className="border-b border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
          <Search size={15} color="#666" />
          <input
            type="search"
            placeholder="Search friends to message"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {friendResults.length > 0 ? (
          <div className="mt-2 space-y-1">
            {friendResults.map((f) => (
              <Link
                key={f.id}
                href={`/messages/${f.id}`}
                onClick={() => setQuery('')}
                className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-gray-50"
              >
                {f.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.avatarUrl} alt={f.firstName} className="h-8 w-8 rounded-full object-cover" />
                ) : null}
                <span>
                  {f.firstName} {f.lastName}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? <p className="p-4 text-xs text-gray-400">Loading conversations…</p> : null}
        {!isLoading && conversations?.items.length === 0 ? (
          <p className="p-4 text-xs text-gray-400">No conversations yet. Search a friend above to start one.</p>
        ) : null}
        {conversations?.items.map((c) => (
          <Link
            key={c.user.id}
            href={`/messages/${c.user.id}`}
            className={`flex items-center gap-3 border-b border-gray-50 p-3 hover:bg-gray-50 ${
              activeUserId === c.user.id ? 'bg-gray-50' : ''
            }`}
          >
            {c.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.user.avatarUrl} alt={c.user.firstName} className="h-11 w-11 rounded-full object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {c.user.firstName} {c.user.lastName}
                </p>
                {c.lastMessage ? <span className="text-xs text-gray-400">{timeAgo(c.lastMessage.createdAt)}</span> : null}
              </div>
              <p className={`truncate text-xs ${c.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {c.lastMessage?.content ?? ''}
              </p>
            </div>
            {c.unreadCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                {c.unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
