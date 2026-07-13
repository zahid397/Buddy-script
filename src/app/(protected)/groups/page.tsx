'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Users2 } from 'lucide-react';
import { useGroups, useJoinGroup, useLeaveGroup } from '@/hooks/useGroups';
import { ApiError } from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TABS = [
  { key: 'discover', label: 'Discover' },
  { key: 'joined', label: 'Your Groups' },
] as const;

export default function GroupsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('discover');
  const { data, isLoading } = useGroups(tab);
  const join = useJoinGroup();
  const leave = useLeaveGroup();

  const handleToggleMembership = async (groupId: string, isMember: boolean) => {
    try {
      if (isMember) {
        await leave.mutateAsync(groupId);
        toast.success('Left group');
      } else {
        await join.mutateAsync(groupId);
        toast.success('Joined group');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update membership');
    }
  };

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Groups</h2>
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
      </div>

      {isLoading ? <LoadingSpinner /> : null}

      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <div className="_feed_inner_area _b_radious6 flex flex-col items-center gap-2 bg-white px-5 py-16 text-center">
          <Users2 size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">
            {tab === 'joined' ? "You haven't joined any groups yet." : 'No groups to discover right now.'}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.items.map((group) => (
          <div key={group.id} className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
            {group.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.coverImageUrl} alt={group.name} className="h-28 w-full object-cover" />
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-brand/10">
                <Users2 size={28} className="text-brand" />
              </div>
            )}
            <div className="p-4">
              <Link href={`/groups/${group.id}`} className="text-sm font-semibold text-gray-800 hover:underline">
                {group.name}
              </Link>
              {group.description ? <p className="mt-1 line-clamp-2 text-xs text-gray-400">{group.description}</p> : null}
              <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                <Users2 size={12} /> {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={() => handleToggleMembership(group.id, group.isMember)}
                disabled={join.isPending || leave.isPending}
                className={`mt-3 w-full rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                  group.isMember ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-brand text-white'
                }`}
              >
                {group.isMember ? 'Leave Group' : 'Join Group'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
