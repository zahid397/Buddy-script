'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSubmitScore } from '@/hooks/useGames';

type Cell = 'X' | 'O' | null;
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(board: Cell[]): Cell {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function pickComputerMove(board: Cell[]): number {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i !== -1);
  // Win if possible
  for (const i of empty) {
    const copy = [...board];
    copy[i] = 'O';
    if (winnerOf(copy) === 'O') return i;
  }
  // Block player's win
  for (const i of empty) {
    const copy = [...board];
    copy[i] = 'X';
    if (winnerOf(copy) === 'X') return i;
  }
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe({ onBestScoreChange }: { onBestScoreChange?: (score: number) => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'draw'>('playing');
  const [wins, setWins] = useState(0);
  const submitScore = useSubmitScore();

  const winner = winnerOf(board);
  const isDraw = !winner && board.every((c) => c !== null);

  useEffect(() => {
    if (status !== 'playing') return;
    if (winner === 'X') {
      setStatus('won');
      setWins((w) => w + 1);
      const score = 100 + wins * 10;
      submitScore.mutate({ gameType: 'TIC_TAC_TOE', score });
      onBestScoreChange?.(score);
    } else if (winner === 'O') {
      setStatus('lost');
      setWins(0);
      submitScore.mutate({ gameType: 'TIC_TAC_TOE', score: 0 });
    } else if (isDraw) {
      setStatus('draw');
      submitScore.mutate({ gameType: 'TIC_TAC_TOE', score: 50 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw, status]);

  const handleClick = (i: number) => {
    if (board[i] || status !== 'playing') return;
    const next = [...board];
    next[i] = 'X';
    setBoard(next);
    if (!winnerOf(next) && next.some((c) => c === null)) {
      setTimeout(() => {
        setBoard((current) => {
          if (winnerOf(current)) return current;
          const move = pickComputerMove(current);
          const withMove = [...current];
          withMove[move] = 'O';
          return withMove;
        });
      }, 400);
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setStatus('playing');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-600">
        {status === 'playing' ? "Your turn — you're X" : status === 'won' ? 'You won! 🎉' : status === 'lost' ? 'The computer won.' : "It's a draw."}
      </p>
      <div className="grid grid-cols-3 gap-1.5" role="grid" aria-label="Tic-tac-toe board">
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
            onClick={() => handleClick(i)}
            disabled={Boolean(cell) || status !== 'playing'}
            className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-50 disabled:hover:bg-transparent sm:h-20 sm:w-20"
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">Win streak: {wins}</p>
      <button
        type="button"
        onClick={handleRestart}
        className="flex items-center gap-1.5 rounded-md bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
      >
        <RotateCcw size={13} /> {status === 'playing' ? 'Restart' : 'Play again'}
      </button>
    </div>
  );
}
