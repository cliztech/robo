import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useKeyboardNav — Keyboard navigation for gear cards on the canvas.
 *
 * Supports:
 *   - Tab / Shift+Tab to cycle through gear cards
 *   - Arrow keys to move the focused gear card
 *   - Delete / Backspace to remove the focused card
 *   - Escape to deselect
 *   - Focus ring visual indicator
 */

export interface KeyboardNavOptions {
    /** Item IDs in display order */
    itemIds: string[];
    /** Grid snap size in px for arrow-key movement */
    moveStep?: number;
    /** Callback when an item is deleted via keyboard */
    onDelete?: (id: string) => void;
    /** Callback when an item is moved via arrow keys */
    onMove?: (id: string, dx: number, dy: number) => void;
    /** Whether keyboard nav is enabled */
    enabled?: boolean;
}

export function useKeyboardNav({
    itemIds,
    moveStep = 20,
    onDelete,
    onMove,
    enabled = true,
}: KeyboardNavOptions) {
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const containerRef = useRef<HTMLElement | null>(null);

    // Keep focusedId valid when items change
    useEffect(() => {
        if (focusedId && !itemIds.includes(focusedId)) {
            setFocusedId(null);
        }
    }, [itemIds, focusedId]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled || itemIds.length === 0) return;

            const idx = focusedId ? itemIds.indexOf(focusedId) : -1;

            switch (e.key) {
                case "Tab": {
                    if (itemIds.length === 0) return;
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Previous item
                        const prev = idx <= 0 ? itemIds.length - 1 : idx - 1;
                        setFocusedId(itemIds[prev]);
                    } else {
                        // Next item
                        const next = idx >= itemIds.length - 1 ? 0 : idx + 1;
                        setFocusedId(itemIds[next]);
                    }
                    break;
                }
                case "ArrowUp":
                    if (focusedId && onMove) {
                        e.preventDefault();
                        onMove(focusedId, 0, -moveStep);
                    }
                    break;
                case "ArrowDown":
                    if (focusedId && onMove) {
                        e.preventDefault();
                        onMove(focusedId, 0, moveStep);
                    }
                    break;
                case "ArrowLeft":
                    if (focusedId && onMove) {
                        e.preventDefault();
                        onMove(focusedId, -moveStep, 0);
                    }
                    break;
                case "ArrowRight":
                    if (focusedId && onMove) {
                        e.preventDefault();
                        onMove(focusedId, moveStep, 0);
                    }
                    break;
                case "Delete":
                case "Backspace":
                    if (focusedId && onDelete) {
                        e.preventDefault();
                        onDelete(focusedId);
                    }
                    break;
                case "Escape":
                    setFocusedId(null);
                    break;
                default:
                    break;
            }
        },
        [enabled, focusedId, itemIds, moveStep, onDelete, onMove],
    );

    useEffect(() => {
        if (!enabled) return;
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enabled, handleKeyDown]);

    const isFocused = useCallback(
        (id: string) => focusedId === id,
        [focusedId],
    );

    const selectItem = useCallback((id: string) => {
        setFocusedId(id);
    }, []);

    const clearFocus = useCallback(() => {
        setFocusedId(null);
    }, []);

    return {
        focusedId,
        isFocused,
        selectItem,
        clearFocus,
        containerRef,
    };
}
