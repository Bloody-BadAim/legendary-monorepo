'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

type Phase = 'focus' | 'break' | 'idle';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PomodoroTimer() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SEC);
  const [isRunning, setIsRunning] = useState(false);

  const totalSec =
    phase === 'focus' ? FOCUS_SEC : phase === 'break' ? BREAK_SEC : 0;
  const progress = totalSec ? 1 - secondsLeft / totalSec : 0;

  const start = useCallback((p: 'focus' | 'break') => {
    setPhase(p);
    setSecondsLeft(p === 'focus' ? FOCUS_SEC : BREAK_SEC);
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(FOCUS_SEC);
  }, []);

  useEffect(() => {
    if (!isRunning || phase === 'idle') return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, phase]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-lg">🍅</span> Pomodoro
      </h2>

      {phase === 'idle' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">25 min focus, 5 min pauze.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => start('focus')}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Start focus (25 min)
            </button>
            <button
              type="button"
              onClick={() => start('break')}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80"
            >
              Start pauze (5 min)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              'font-mono text-4xl font-bold',
              phase === 'focus' ? 'text-accent-blue' : 'text-accent-emerald'
            )}
          >
            {formatTime(secondsLeft)}
          </div>
          <p className="text-sm text-muted">
            {phase === 'focus' ? 'Focus' : 'Pauze'}
            {!isRunning && secondsLeft === 0 && ' – klaar!'}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-1000',
                phase === 'focus' ? 'bg-accent-blue' : 'bg-accent-emerald'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={() => setIsRunning(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:opacity-80"
              >
                Pauzeren
              </button>
            ) : secondsLeft > 0 ? (
              <button
                type="button"
                onClick={() => setIsRunning(true)}
                className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Hervatten
              </button>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
