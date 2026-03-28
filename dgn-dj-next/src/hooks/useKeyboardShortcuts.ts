// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Keyboard Shortcuts System
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export const DEFAULT_SHORTCUTS: ShortcutCategory[] = [
  {
    name: 'Transport',
    shortcuts: [
      { key: ' ', action: () => {}, description: 'Play/Pause' },
      { key: 'c', action: () => {}, description: 'Cue' },
      { key: 'r', action: () => {}, description: 'Record' },
    ],
  },
  {
    name: 'Decks',
    shortcuts: [
      { key: '1', action: () => {}, description: 'Select Deck A' },
      { key: '2', action: () => {}, description: 'Select Deck B' },
      { key: '3', action: () => {}, description: 'Select Deck C' },
      { key: '4', action: () => {}, description: 'Select Deck D' },
      { key: 's', action: () => {}, description: 'Sync' },
      { key: 'l', action: () => {}, description: 'Loop' },
    ],
  },
  {
    name: 'Mixer',
    shortcuts: [
      { key: 'm', action: () => {}, description: 'Mute' },
      { key: 'z', action: () => {}, description: 'Crossfade Left' },
      { key: 'x', action: () => {}, description: 'Crossfade Right' },
    ],
  },
  {
    name: 'Effects',
    shortcuts: [
      { key: 'q', action: () => {}, description: 'FX 1' },
      { key: 'w', action: () => {}, description: 'FX 2' },
      { key: 'e', action: () => {}, description: 'FX 3' },
      { key: 'f', action: () => {}, description: 'Filter' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { key: 'b', action: () => {}, description: 'Browse' },
      { key: 'Tab', action: () => {}, description: 'Switch View' },
      { key: 'Esc', action: () => {}, description: 'Close/Cancel' },
    ],
  },
];

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const altMatch = shortcut.alt ? event.altKey : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : true;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}
