import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { leaderboardSortDirection } from '@/lib/games';
import type { GameLeaderboardEntryDTO, GameType } from '@/types';

const GAME_TYPES: GameType[] = ['TIC_TAC_TOE', 'MEMORY_MATCH', 'REACTION_TIMER'];

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const gameTypeParam = request.nextUrl.searchParams.get('gameType');
  const gameType = GAME_TYPES.includes(gameTypeParam as GameType) ? (gameTypeParam as GameType) : 'TIC_TAC_TOE';

  const rows = await prisma.gameScore.groupBy({
    by: ['userId'],
    where: { gameType },
    _max: { score: true },
    _min: { score: true },
  });

  const direction = leaderboardSortDirection(gameType);
  const bestByUser = rows.map((r) => ({
    userId: r.userId,
    score: direction === 'asc' ? (r._min.score as number) : (r._max.score as number),
  }));
  bestByUser.sort((a, b) => (direction === 'asc' ? a.score - b.score : b.score - a.score));
  const top = bestByUser.slice(0, 10);

  const users = await prisma.user.findMany({ where: { id: { in: top.map((t) => t.userId) } } });
  const usersById = new Map(users.map((u) => [u.id, u]));

  const items: GameLeaderboardEntryDTO[] = top
    .map((t) => {
      const user = usersById.get(t.userId);
      if (!user) return null;
      return { user: toPostAuthor(user), score: t.score, isMe: t.userId === userId };
    })
    .filter((x): x is GameLeaderboardEntryDTO => x !== null);

  return NextResponse.json({ items });
}
