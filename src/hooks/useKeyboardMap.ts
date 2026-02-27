import { useEffect, useCallback } from 'react';

export type KeyBinding = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
    category: 'transport' | 'mixer' | 'browser' | 'global';
};

interface UseKeyboardMapProps {
    bindings: KeyBinding[];
    isEnabled?: boolean;
}

export function useKeyboardMap({ bindings, isEnabled = true }: UseKeyboardMapProps) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!isEnabled) return;
        
        // Don't trigger if user is typing in an input or textarea
        if (
            event.target instanceof HTMLInputElement || 
            event.target instanceof HTMLTextAreaElement ||
            (event.target as HTMLElement).isContentEditable
        ) {
            return;
        }

        const match = bindings.find(b => 
            b.key.toLowerCase() === event.key.toLowerCase() &&
            !!b.ctrl === event.ctrlKey &&
            !!b.shift === event.shiftKey &&
            !!b.alt === event.altKey
        );

        if (match) {
            event.preventDefault();
            match.action();
        }
    }, [bindings, isEnabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
