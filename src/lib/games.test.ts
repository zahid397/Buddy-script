import { describe, expect, it } from 'vitest';
import { isBetterScore, leaderboardSortDirection } from './games';

describe('games — score comparison direction', () => {
  it('treats a higher score as better for TIC_TAC_TOE and MEMORY_MATCH', () => {
    expect(isBetterScore('TIC_TAC_TOE', 100, 50)).toBe(true);
    expect(isBetterScore('TIC_TAC_TOE', 50, 100)).toBe(false);
    expect(isBetterScore('MEMORY_MATCH', 900, 500)).toBe(true);
  });

  it('treats a lower score as better for REACTION_TIMER (milliseconds)', () => {
    expect(isBetterScore('REACTION_TIMER', 200, 300)).toBe(true);
    expect(isBetterScore('REACTION_TIMER', 300, 200)).toBe(false);
  });

  it('leaderboard sort direction matches the same rule', () => {
    expect(leaderboardSortDirection('TIC_TAC_TOE')).toBe('desc');
    expect(leaderboardSortDirection('MEMORY_MATCH')).toBe('desc');
    expect(leaderboardSortDirection('REACTION_TIMER')).toBe('asc');
  });
});
