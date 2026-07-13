'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSubmitScore } from '@/hooks/useGames';

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'tooSoon';

export default function ReactionTimer() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitScore = useSubmitScore();

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const start = useCallback(() => {
    setPhase('waiting');
    setReactionMs(null);
    const delay = 1200 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, []);

  const handleAction = () => {
    if (phase === 'idle' || phase === 'result' || phase === 'tooSoon') {
      start();
      return;
    }
    if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('tooSoon');
      return;
    }
    if (phase === 'ready') {
      const ms = Math.round(performance.now() - startTimeRef.current);
      setReactionMs(ms);
      setPhase('result');
      submitScore.mutate({ gameType: 'REACTION_TIMER', score: ms });
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleAction();
    }
  };

  const bg =
    phase === 'ready' ? 'bg-green-500' : phase === 'tooSoon' ? 'bg-red-500' : phase === 'waiting' ? 'bg-amber-400' : 'bg-brand';

  const label =
    phase === 'idle'
      ? 'Click to start'
      : phase === 'waiting'
        ? 'Wait for green…'
        : phase === 'ready'
          ? 'Click now!'
          : phase === 'tooSoon'
            ? 'Too soon — click to retry'
            : `${reactionMs} ms — click to try again`;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">Click (or press Space) as soon as the box turns green.</p>
      <button
        type="button"
        onClick={handleAction}
        onKeyDown={handleKey}
        className={`flex h-40 w-full max-w-sm items-center justify-center rounded-card text-lg font-semibold text-white transition-colors sm:h-52 ${bg}`}
      >
        {label}
      </button>
      {reactionMs !== null ? (
        <p className="text-sm font-medium text-gray-700">
          Your reaction time: <span className="text-brand">{reactionMs} ms</span>
        </p>
      ) : null}
    </div>
  );
}
