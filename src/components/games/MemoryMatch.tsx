'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { useSubmitScore } from '@/hooks/useGames';

const SYMBOLS = ['🚀', '🎨', '🎮', '📚', '🎧', '🧩', '🌱', '⚡'];

function shuffledDeck(): { id: number; symbol: string }[] {
  const deck = [...SYMBOLS, ...SYMBOLS].map((symbol, i) => ({ id: i, symbol }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryMatch() {
  const [deck, setDeck] = useState<{ id: number; symbol: string }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const submitScore = useSubmitScore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [started, finished]);

  useEffect(() => {
    if (deck.length > 0 && matched.size === deck.length && !finished) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const score = Math.max(50, 1000 - moves * 15 - seconds * 5);
      submitScore.mutate({ gameType: 'MEMORY_MATCH', score });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, deck.length]);

  const handleStart = () => {
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setSeconds(0);
    setStarted(true);
    setFinished(false);
  };

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.has(index) || finished) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].symbol === deck[b].symbol) {
        setTimeout(() => {
          setMatched((prev) => new Set(prev).add(a).add(b));
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-gray-500">Flip cards to find all 8 matching pairs.</p>
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          <Play size={14} /> Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-xs text-gray-500">
        <span>Moves: {moves}</span>
        <span>Time: {seconds}s</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {deck.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.has(i);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(i)}
              aria-label={isFlipped ? card.symbol : 'Hidden card'}
              className={`flex h-14 w-14 items-center justify-center rounded-md text-xl sm:h-16 sm:w-16 ${
                isFlipped ? 'bg-brand/10' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isFlipped ? card.symbol : ''}
            </button>
          );
        })}
      </div>
      {finished ? <p className="text-sm font-medium text-brand">Solved in {moves} moves / {seconds}s! 🎉</p> : null}
      <button
        type="button"
        onClick={handleStart}
        className="flex items-center gap-1.5 rounded-md bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
      >
        <RotateCcw size={13} /> {finished ? 'Play again' : 'Restart'}
      </button>
    </div>
  );
}
