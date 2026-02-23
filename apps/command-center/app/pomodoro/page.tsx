'use client';

import { useState, useEffect } from 'react';
import { PomodoroTimer } from '@/components/dashboard/pomodoro-timer';

export default function PomodoroPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={
        mounted
          ? 'max-w-md opacity-100 transition-opacity duration-300'
          : 'max-w-md opacity-0'
      }
    >
      <PomodoroTimer />
      <p className="mt-4 text-xs text-muted">
        Tip: zet je notificaties uit tijdens een focus-sessie.
      </p>
    </div>
  );
}
