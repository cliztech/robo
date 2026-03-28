import { useState, useCallback, useRef } from "react";

/**
 * useUndoRedo — Generic undo/redo history for any state type.
 *
 * Supports:
 *   - Push new states onto the history stack
 *   - Undo (Ctrl+Z) / Redo (Ctrl+Y / Ctrl+Shift+Z)
 *   - History limit to avoid unbounded memory growth
 *   - canUndo / canRedo booleans for UI controls
 */

interface UseUndoRedoOptions {
    maxHistory?: number;
}

export function useUndoRedo<T>(
    initialState: T,
    options: UseUndoRedoOptions = {},
) {
    const { maxHistory = 50 } = options;

    const [state, setState] = useState<T>(initialState);
    const pastRef = useRef<T[]>([]);
    const futureRef = useRef<T[]>([]);

    const push = useCallback(
        (newState: T) => {
            pastRef.current = [
                ...pastRef.current.slice(-(maxHistory - 1)),
                state,
            ];
            futureRef.current = []; // Clear redo stack on new action
            setState(newState);
        },
        [state, maxHistory],
    );

    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;
        const prev = pastRef.current[pastRef.current.length - 1];
        pastRef.current = pastRef.current.slice(0, -1);
        futureRef.current = [...futureRef.current, state];
        setState(prev);
    }, [state]);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;
        const next = futureRef.current[futureRef.current.length - 1];
        futureRef.current = futureRef.current.slice(0, -1);
        pastRef.current = [...pastRef.current, state];
        setState(next);
    }, [state]);

    const reset = useCallback(
        (newState: T) => {
            pastRef.current = [];
            futureRef.current = [];
            setState(newState);
        },
        [],
    );

    const canUndo = pastRef.current.length > 0;
    const canRedo = futureRef.current.length > 0;
    const historyLength = pastRef.current.length;

    return {
        state,
        setState: push,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
        historyLength,
    };
}
