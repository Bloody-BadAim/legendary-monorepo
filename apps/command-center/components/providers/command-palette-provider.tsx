'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommandPalette } from '@/components/ui/command-palette';
import { CommandPaletteContext } from '@/components/ui/command-palette';
import { ShortcutsOverlay } from '@/components/ui/shortcuts-overlay';
import { ShortcutsOverlayContext } from '@/components/ui/shortcuts-overlay';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isOverlayOpen, setOverlayOpen] = useState(false);

  const openPalette = useCallback(() => {
    setOverlayOpen(false);
    setPaletteOpen(true);
  }, []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openOverlay = useCallback(() => {
    setPaletteOpen(false);
    setOverlayOpen(true);
  }, []);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  useKeyboardShortcuts({
    onOpenPalette: openPalette,
    onClosePalette: closePalette,
    onOpenOverlay: openOverlay,
    onCloseOverlay: closeOverlay,
    isPaletteOpen: isPaletteOpen,
    isOverlayOpen: isOverlayOpen,
    router,
  });

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen: isPaletteOpen,
        open: openPalette,
        close: closePalette,
      }}
    >
      <ShortcutsOverlayContext.Provider
        value={{
          isOpen: isOverlayOpen,
          open: openOverlay,
          close: closeOverlay,
        }}
      >
        {children}
        <CommandPalette />
        <ShortcutsOverlay />
      </ShortcutsOverlayContext.Provider>
    </CommandPaletteContext.Provider>
  );
}
