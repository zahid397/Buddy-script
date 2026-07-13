import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { submitGameScoreSchema } from '@/lib/validation';
import { isBetterScore } from '@/lib/games';
import type { GameType } from '@/types';

const GAME_TYPES: GameType[] = ['TIC_TAC_TOE', 'MEMORY_MATCH', 'REACTION_TIMER'];

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const rows = await prisma.gameScore.findMany({ where: { userId } });

  const best: Record<GameType, number | null> = { TIC_TAC_TOE: null, MEMORY_MATCH: null, REACTION_TIMER: null };
  for (const gameType of GAME_TYPES) {
    const scoresForGame = rows.filter((r) => r.gameType === gameType).map((r) => r.score);
    best[gameType] = scoresForGame.reduce<number | null>(
      (acc, score) => (acc === null || isBetterScore(gameType, score, acc) ? score : acc),
      null
    );
  }

  return NextResponse.json({ best });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = submitGameScoreSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const score = await prisma.gameScore.create({
    data: { userId, gameType: parsed.data.gameType, score: parsed.data.score },
  });

  return NextResponse.json({ id: score.id, gameType: score.gameType, score: score.score }, { status: 201 });
}
