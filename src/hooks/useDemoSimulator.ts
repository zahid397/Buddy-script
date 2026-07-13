'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';
import type { DemoEventType } from '@/lib/demo/demo-engine';

const TICK_INTERVAL_MS = 20_000;

// Which cached queries a given tick event can affect, so the UI updates
// without a page refresh. `import type` above means none of demo-engine's
// server-only code (Prisma, etc.) is bundled here — just the type name.
const INVALIDATION_MAP: Record<DemoEventType, string[][]> = {
  POST: [['posts']],
  LIKE: [['posts'], ['notifications'], ['notifications-unread-count']],
  COMMENT: [['posts'], ['notifications'], ['notifications-unread-count']],
  FRIEND_REQUEST: [['friend-requests'], ['notifications'], ['notifications-unread-count']],
  FRIEND_ACCEPT: [
    ['friends'],
    ['friend-requests'],
    ['user-suggestions'],
    ['notifications'],
    ['notifications-unread-count'],
    ['profile'],
  ],
  MESSAGE: [['conversations'], ['messages-unread-count'], ['notifications'], ['notifications-unread-count']],
  MESSAGE_REPLY: [['conversations'], ['messages'], ['messages-unread-count'], ['notifications'], ['notifications-unread-count']],
  EVENT_ATTEND: [['events'], ['notifications'], ['notifications-unread-count']],
  LEARN_SUGGEST: [['notifications'], ['notifications-unread-count']],
  LEARN_COMPLETE: [['learning-courses']],
  SAVE_POST: [['bookmarks']],
  GROUP_POST: [['group-posts'], ['groups'], ['notifications'], ['notifications-unread-count']],
  GROUP_JOIN: [['groups'], ['notifications'], ['notifications-unread-count']],
  GAME_LEADERBOARD: [['game-leaderboard'], ['game-best-scores'], ['notifications'], ['notifications-unread-count']],
};

/** Mounted once in AppShell. While DEMO_MODE is on and someone is signed
 * in, polls the tick endpoint every 20s and invalidates whatever query
 * keys the resulting event affects so the feed/notifications/messages/etc.
 * update live without a refresh. A no-op (including the network call
 * itself) the moment Demo Mode is off. */
export function useDemoSimulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: status } = useQuery({
    queryKey: ['demo-status'],
    queryFn: () => apiFetch<{ enabled: boolean }>('/api/demo/status'),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!status?.enabled || !user) return undefined;

    const tick = async () => {
      try {
        const res = await apiFetch<{ event: DemoEventType | null }>('/api/demo/tick', { method: 'POST' });
        if (res.event) {
          for (const queryKey of INVALIDATION_MAP[res.event] ?? []) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      } catch {
        // Ambient background flavor, not a critical path — a failed tick
        // just means one 20s window passes with no simulated activity.
      }
    };

    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status?.enabled, user, queryClient]);
}
