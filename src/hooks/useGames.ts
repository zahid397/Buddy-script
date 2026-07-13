'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { GameLeaderboardEntryDTO, GameType } from '@/types';

export function useBestScores() {
  return useQuery({
    queryKey: ['game-best-scores'],
    queryFn: () => apiFetch<{ best: Record<GameType, number | null> }>('/api/games/scores'),
  });
}

export function useLeaderboard(gameType: GameType) {
  return useQuery({
    queryKey: ['game-leaderboard', gameType],
    queryFn: () => apiFetch<{ items: GameLeaderboardEntryDTO[] }>(`/api/games/leaderboard?gameType=${gameType}`),
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameType, score }: { gameType: GameType; score: number }) =>
      apiFetch('/api/games/scores', { method: 'POST', body: JSON.stringify({ gameType, score }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-best-scores'] });
      queryClient.invalidateQueries({ queryKey: ['game-leaderboard'] });
    },
  });
}
