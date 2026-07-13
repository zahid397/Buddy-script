'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import type { GameType } from '@/types';
import { useBestScores, useLeaderboard } from '@/hooks/useGames';
import TicTacToe from '@/components/games/TicTacToe';
import MemoryMatch from '@/components/games/MemoryMatch';
import ReactionTimer from '@/components/games/ReactionTimer';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const GAMES: { key: GameType; label: string; unit: string }[] = [
  { key: 'TIC_TAC_TOE', label: 'Tic-Tac-Toe', unit: 'pts' },
  { key: 'MEMORY_MATCH', label: 'Memory Match', unit: 'pts' },
  { key: 'REACTION_TIMER', label: 'Reaction Timer', unit: 'ms' },
];

export default function GamingPage() {
  const [active, setActive] = useState<GameType>('TIC_TAC_TOE');
  const { data: bestData } = useBestScores();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard(active);

  const activeMeta = GAMES.find((g) => g.key === active)!;
  const best = bestData?.best[active];

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Gaming</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {GAMES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setActive(g.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                active === g.key ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="_feed_inner_area _b_radious6 mb-4 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{activeMeta.label}</h3>
          <p className="text-xs text-gray-400">
            Best score: <span className="font-semibold text-brand">{best != null ? `${best} ${activeMeta.unit}` : '—'}</span>
          </p>
        </div>
        {active === 'TIC_TAC_TOE' ? <TicTacToe /> : null}
        {active === 'MEMORY_MATCH' ? <MemoryMatch /> : null}
        {active === 'REACTION_TIMER' ? <ReactionTimer /> : null}
      </div>

      <div className="_feed_inner_area _b_radious6 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Trophy size={15} className="text-brand" /> {activeMeta.label} leaderboard
        </h3>
        {leaderboardLoading ? <LoadingSpinner /> : null}
        {!leaderboardLoading && (leaderboardData?.items.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No scores yet — be the first to play!</p>
        ) : null}
        <ol className="space-y-1">
          {leaderboardData?.items.map((entry, i) => (
            <li
              key={entry.user.id}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                entry.isMe ? 'bg-brand/10' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-4 text-xs text-gray-400">{i + 1}</span>
                {entry.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.user.avatarUrl} alt={entry.user.firstName} className="h-6 w-6 rounded-full object-cover" />
                ) : null}
                <span className={entry.isMe ? 'font-semibold text-brand' : 'text-gray-700'}>
                  {entry.user.firstName} {entry.user.lastName} {entry.isMe ? '(you)' : ''}
                </span>
              </span>
              <span className="text-xs font-medium text-gray-500">
                {entry.score} {activeMeta.unit}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
