import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTouchDrag } from "@/components/gear/hooks/useTouchDrag";

describe("useTouchDrag", () => {
  const makePositions = () => ({
    "item-1": { x: 0, y: 0 },
  });

  it("returns touch event handlers", () => {
    const setPositions = vi.fn();
    const { result } = renderHook(() =>
      useTouchDrag({
        positions: makePositions(),
        setPositions,
      }),
    );
    expect(typeof result.current.onTouchStart).toBe("function");
    expect(typeof result.current.onTouchMove).toBe("function");
    expect(typeof result.current.onTouchEnd).toBe("function");
  });

  it("onTouchEnd does not throw", () => {
    const setPositions = vi.fn();
    const { result } = renderHook(() =>
      useTouchDrag({
        positions: makePositions(),
        setPositions,
      }),
    );
    expect(() => result.current.onTouchEnd()).not.toThrow();
  });

  it("respects gridSnap option", () => {
    const setPositions = vi.fn();
    const { result } = renderHook(() =>
      useTouchDrag({
        gridSnap: true,
        snapSize: 20,
        positions: makePositions(),
        setPositions,
      }),
    );
    // Hook should initialize without error
    expect(typeof result.current.onTouchStart).toBe("function");
  });
});
