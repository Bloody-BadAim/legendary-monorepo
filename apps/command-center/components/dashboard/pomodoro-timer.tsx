'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const FOCUS_SEC = 25 * 60;
const SHORT_BREAK_SEC = 5 * 60;
const LONG_BREAK_SEC = 15 * 60;
const SESSIONS_PER_BLOCK = 4;

type Phase = 'focus' | 'break' | 'longBreak' | 'idle' | 'focusComplete';

export interface PomodoroSelectedTask {
  id: string;
  name: string;
}

export interface PomodoroTimerProps {
  selectedTask?: PomodoroSelectedTask | null;
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars -- callback param name is for API docs
  onFocusComplete?: (taskId: string | null) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function requestNotificationPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function notify(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // ignore
  }
}

export function PomodoroTimer({
  selectedTask = null,
  onFocusComplete,
}: PomodoroTimerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SEC);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionInBlock, setSessionInBlock] = useState(1);

  const totalSec =
    phase === 'focus'
      ? FOCUS_SEC
      : phase === 'break'
        ? SHORT_BREAK_SEC
        : phase === 'longBreak'
          ? LONG_BREAK_SEC
          : 0;
  const progress = totalSec ? 1 - secondsLeft / totalSec : 0;

  const start = useCallback((p: 'focus' | 'break' | 'longBreak') => {
    setPhase(p);
    setSecondsLeft(
      p === 'focus'
        ? FOCUS_SEC
        : p === 'break'
          ? SHORT_BREAK_SEC
          : LONG_BREAK_SEC
    );
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(FOCUS_SEC);
    setSessionInBlock(1);
  }, []);

  const handleFocusEnd = useCallback(() => {
    setIsRunning(false);
    setSessionInBlock((prev) => (prev >= SESSIONS_PER_BLOCK ? 1 : prev + 1));
    notify('Pomodoro klaar', 'Focus-sessie afgerond. Tijd voor een pauze.');
    onFocusComplete?.(selectedTask?.id ?? null);
    setPhase('focusComplete');
  }, [selectedTask?.id, onFocusComplete]);

  const handleBreakEnd = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    notify('Pauze klaar', 'Klaar om weer te focussen.');
  }, []);

  useEffect(() => {
    if (!isRunning || phase === 'idle' || phase === 'focusComplete') return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (phase === 'focus') handleFocusEnd();
          else if (phase === 'break' || phase === 'longBreak') handleBreakEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, phase, handleFocusEnd, handleBreakEnd]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-lg">🍅</span> Pomodoro
      </h2>

      {phase === 'idle' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            25 min focus, 5 min korte pauze, 15 min lange pauze.
          </p>
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="text-xs text-muted underline hover:text-foreground"
          >
            Notificaties inschakelen
          </button>
          <div className="flex flex-wrap gap-2">
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
            <button
              type="button"
              onClick={() => start('longBreak')}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80"
            >
              Lange pauze (15 min)
            </button>
          </div>
        </div>
      ) : phase === 'focusComplete' ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold text-accent-emerald">
            Focus klaar!
          </p>
          <p className="text-sm text-muted">Kies een pauze of start opnieuw.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => start('break')}
              className="rounded-lg bg-accent-emerald/20 px-4 py-2 text-sm font-semibold text-accent-emerald hover:bg-accent-emerald/30"
            >
              Korte pauze (5 min)
            </button>
            <button
              type="button"
              onClick={() => start('longBreak')}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80"
            >
              Lange pauze (15 min)
            </button>
            <button
              type="button"
              onClick={() => start('focus')}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Volgende focus
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {phase === 'focus' && selectedTask && (
            <p className="rounded-lg border border-border bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-200">
              Taak: {selectedTask.name}
            </p>
          )}
          {phase === 'focus' && (
            <p className="text-xs text-muted">
              Sessie {sessionInBlock}/{SESSIONS_PER_BLOCK}
            </p>
          )}
          <div
            className={cn(
              'font-mono text-4xl font-bold',
              phase === 'focus' ? 'text-accent-blue' : 'text-accent-emerald'
            )}
          >
            {formatTime(secondsLeft)}
          </div>
          <p className="text-sm text-muted">
            {phase === 'focus'
              ? 'Focus'
              : phase === 'longBreak'
                ? 'Lange pauze'
                : 'Pauze'}
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
