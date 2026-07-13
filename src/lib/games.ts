import type { GameType } from '@/types';

/** REACTION_TIMER scores are milliseconds — lower is better. The other two
 * are point totals — higher is better. Centralized here so the "best
 * score" and leaderboard-ordering logic never disagree. */
export function isBetterScore(gameType: GameType, candidate: number, current: number): boolean {
  return gameType === 'REACTION_TIMER' ? candidate < current : candidate > current;
}

export function leaderboardSortDirection(gameType: GameType): 'asc' | 'desc' {
  return gameType === 'REACTION_TIMER' ? 'asc' : 'desc';
}
