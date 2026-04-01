import { useState, useCallback, useRef } from "react";

/**
 * useDragReorder — Hook for drag-to-reposition gear units on the canvas.
 *
 * Returns:
 *   - dragState: current drag info (item id, offset, position)
 *   - onDragStart: mouseDown handler to begin drag
 *   - onDragging: mouseMove handler during drag
 *   - onDragEnd: mouseUp handler to finalize position
 *   - getStyle: CSS transform for a specific item
 *   - positions: Record of item id → {x, y}
 *   - resetPositions: clear all positions
 */

export interface DragPosition {
    x: number;
    y: number;
}

interface DragState {
    itemId: string | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
}

const INITIAL_DRAG: DragState = {
    itemId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
};

export function useDragReorder(gridSnap: boolean = false, snapSize: number = 20) {
    const [positions, setPositions] = useState<Record<string, DragPosition>>({});
    const dragRef = useRef<DragState>(INITIAL_DRAG);
    const [, forceUpdate] = useState(0);

    const snap = useCallback(
        (val: number): number => {
            if (!gridSnap) return val;
            return Math.round(val / snapSize) * snapSize;
        },
        [gridSnap, snapSize],
    );

    const onDragStart = useCallback(
        (itemId: string, e: React.MouseEvent) => {
            e.preventDefault();
            const pos = positions[itemId] ?? { x: 0, y: 0 };
            dragRef.current = {
                itemId,
                startX: e.clientX - pos.x,
                startY: e.clientY - pos.y,
                offsetX: pos.x,
                offsetY: pos.y,
                isDragging: true,
            };
            forceUpdate((n) => n + 1);
        },
        [positions],
    );

    const onDragging = useCallback(
        (e: React.MouseEvent) => {
            const d = dragRef.current;
            if (!d.isDragging || !d.itemId) return;

            const x = snap(e.clientX - d.startX);
            const y = snap(e.clientY - d.startY);

            setPositions((prev) => ({
                ...prev,
                [d.itemId!]: { x, y },
            }));
        },
        [snap],
    );

    const onDragEnd = useCallback(() => {
        dragRef.current = INITIAL_DRAG;
        forceUpdate((n) => n + 1);
    }, []);

    const getStyle = useCallback(
        (itemId: string): React.CSSProperties => {
            const pos = positions[itemId];
            if (!pos) return {};
            return {
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                zIndex: dragRef.current.itemId === itemId ? 100 : 1,
                cursor: dragRef.current.isDragging && dragRef.current.itemId === itemId
                    ? "grabbing"
                    : "grab",
                transition: dragRef.current.isDragging && dragRef.current.itemId === itemId
                    ? "none"
                    : "transform 0.15s ease",
            };
        },
        [positions],
    );

    const resetPositions = useCallback(() => {
        setPositions({});
    }, []);

    const isDragging = dragRef.current.isDragging;
    const draggingId = dragRef.current.itemId;

    return {
        positions,
        setPositions,
        isDragging,
        draggingId,
        onDragStart,
        onDragging,
        onDragEnd,
        getStyle,
        resetPositions,
    };
}
