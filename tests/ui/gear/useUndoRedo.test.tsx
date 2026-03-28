import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "@/components/gear/hooks/useUndoRedo";

describe("useUndoRedo", () => {
  it("initializes with the given state", () => {
    const { result } = renderHook(() => useUndoRedo([1, 2, 3]));
    expect(result.current.state).toEqual([1, 2, 3]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushes new state and enables undo", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    act(() => result.current.setState("b"));
    expect(result.current.state).toBe("b");
    expect(result.current.canUndo).toBe(true);
  });

  it("undoes to previous state", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    act(() => result.current.setState("b"));
    act(() => result.current.undo());
    expect(result.current.state).toBe("a");
    expect(result.current.canRedo).toBe(true);
  });

  it("redoes after undo", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    act(() => result.current.setState("b"));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toBe("b");
  });

  it("clears redo stack on new push after undo", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    act(() => result.current.setState("b"));
    act(() => result.current.setState("c"));
    act(() => result.current.undo());
    act(() => result.current.setState("d"));
    expect(result.current.state).toBe("d");
    expect(result.current.canRedo).toBe(false);
  });

  it("does nothing on undo with empty history", () => {
    const { result } = renderHook(() => useUndoRedo(42));
    act(() => result.current.undo());
    expect(result.current.state).toBe(42);
  });

  it("does nothing on redo with empty future", () => {
    const { result } = renderHook(() => useUndoRedo(42));
    act(() => result.current.redo());
    expect(result.current.state).toBe(42);
  });

  it("resets to new state clearing history", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    act(() => result.current.setState("b"));
    act(() => result.current.setState("c"));
    act(() => result.current.reset("x"));
    expect(result.current.state).toBe("x");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("respects maxHistory limit", () => {
    const { result } = renderHook(() => useUndoRedo(0, { maxHistory: 3 }));
    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    act(() => result.current.setState(3));
    act(() => result.current.setState(4));
    act(() => result.current.setState(5));

    // Can go back at most 3 steps
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });

  it("tracks historyLength", () => {
    const { result } = renderHook(() => useUndoRedo("a"));
    expect(result.current.historyLength).toBe(0);
    act(() => result.current.setState("b"));
    expect(result.current.historyLength).toBe(1);
    act(() => result.current.setState("c"));
    expect(result.current.historyLength).toBe(2);
  });
});
