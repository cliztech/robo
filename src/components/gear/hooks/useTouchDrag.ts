import { useCallback, useRef } from "react";
import type { DragPosition } from "./useDragReorder";

/**
 * useTouchDrag — Touch event support for gear drag-reorder on mobile/tablet.
 *
 * Provides onTouchStart/onTouchMove/onTouchEnd handlers that mirror
 * the mouse-based drag behavior from useDragReorder.
 */

export interface TouchDragOptions {
    gridSnap?: boolean;
    snapSize?: number;
    positions: Record<string, DragPosition>;
    setPositions: React.Dispatch<React.SetStateAction<Record<string, DragPosition>>>;
}

interface TouchState {
    itemId: string | null;
    startX: number;
    startY: number;
    active: boolean;
}

const INITIAL: TouchState = {
    itemId: null,
    startX: 0,
    startY: 0,
    active: false,
};

export function useTouchDrag({
    gridSnap = false,
    snapSize = 20,
    positions,
    setPositions,
}: TouchDragOptions) {
    const touchRef = useRef<TouchState>(INITIAL);

    const snap = useCallback(
        (val: number): number => {
            if (!gridSnap) return val;
            return Math.round(val / snapSize) * snapSize;
        },
        [gridSnap, snapSize],
    );

    const onTouchStart = useCallback(
        (itemId: string, e: React.TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            const pos = positions[itemId] ?? { x: 0, y: 0 };
            touchRef.current = {
                itemId,
                startX: touch.clientX - pos.x,
                startY: touch.clientY - pos.y,
                active: true,
            };
        },
        [positions],
    );

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            const t = touchRef.current;
            if (!t.active || !t.itemId) return;
            e.preventDefault(); // Prevent scrolling while dragging

            const touch = e.touches[0];
            if (!touch) return;

            const x = snap(touch.clientX - t.startX);
            const y = snap(touch.clientY - t.startY);

            setPositions((prev) => ({
                ...prev,
                [t.itemId!]: { x, y },
            }));
        },
        [snap, setPositions],
    );

    const onTouchEnd = useCallback(() => {
        touchRef.current = INITIAL;
    }, []);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
}
