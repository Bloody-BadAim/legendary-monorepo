'use client';

import { useEffect, useRef } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

function isInputFocused(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  return false;
}

export interface UseKeyboardShortcutsOptions {
  onOpenPalette: () => void;
  onClosePalette: () => void;
  onOpenOverlay: () => void;
  onCloseOverlay: () => void;
  isPaletteOpen: boolean;
  isOverlayOpen: boolean;
  router: AppRouterInstance;
}

export function useKeyboardShortcuts({
  onOpenPalette,
  onClosePalette,
  onOpenOverlay,
  onCloseOverlay,
  isPaletteOpen,
  isOverlayOpen,
  router,
}: UseKeyboardShortcutsOptions): void {
  const pendingGRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPendingG = () => {
      pendingGRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey || e.altKey;

      if (key === 'escape') {
        if (isOverlayOpen) onCloseOverlay();
        else if (isPaletteOpen) onClosePalette();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (key === '?' && !isMod) {
        e.preventDefault();
        onOpenOverlay();
        return;
      }

      if (key === 'g' && !isMod) {
        pendingGRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(clearPendingG, 1000);
        return;
      }

      if (pendingGRef.current && !isMod) {
        if (key === 'h') {
          e.preventDefault();
          clearPendingG();
          router.push('/');
          return;
        }
        if (key === 't') {
          e.preventDefault();
          clearPendingG();
          router.push('/todo');
          return;
        }
        if (key === 'p') {
          e.preventDefault();
          clearPendingG();
          router.push('/projects');
          return;
        }
        if (key === 'r') {
          e.preventDefault();
          clearPendingG();
          router.push('/roadmap');
          return;
        }
        if (key === 'a') {
          e.preventDefault();
          clearPendingG();
          router.push('/notion-audit');
          return;
        }
        clearPendingG();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearPendingG();
    };
  }, [
    onOpenPalette,
    onClosePalette,
    onOpenOverlay,
    onCloseOverlay,
    isPaletteOpen,
    isOverlayOpen,
    router,
  ]);
}
