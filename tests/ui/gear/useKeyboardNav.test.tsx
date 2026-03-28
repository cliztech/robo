import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardNav } from "@/components/gear/hooks/useKeyboardNav";

describe("useKeyboardNav", () => {
  const items = ["item-1", "item-2", "item-3"];

  it("starts with no focused item", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));
    expect(result.current.focusedId).toBeNull();
  });

  it("selectItem sets the focused id", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));
    act(() => result.current.selectItem("item-2"));
    expect(result.current.focusedId).toBe("item-2");
  });

  it("isFocused returns true for the focused item", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));
    act(() => result.current.selectItem("item-1"));
    expect(result.current.isFocused("item-1")).toBe(true);
    expect(result.current.isFocused("item-2")).toBe(false);
  });

  it("clearFocus resets to null", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));
    act(() => result.current.selectItem("item-1"));
    act(() => result.current.clearFocus());
    expect(result.current.focusedId).toBeNull();
  });

  it("clears focus when focused item is removed from list", () => {
    const { result, rerender } = renderHook(
      ({ ids }) => useKeyboardNav({ itemIds: ids }),
      { initialProps: { ids: items } },
    );
    act(() => result.current.selectItem("item-2"));
    expect(result.current.focusedId).toBe("item-2");

    rerender({ ids: ["item-1", "item-3"] });
    expect(result.current.focusedId).toBeNull();
  });

  it("Tab key cycles through items", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));

    // First tab — selects first item
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(result.current.focusedId).toBe("item-1");

    // Second tab — selects second item
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(result.current.focusedId).toBe("item-2");
  });

  it("Escape clears focus via keyboard", () => {
    const { result } = renderHook(() => useKeyboardNav({ itemIds: items }));
    act(() => result.current.selectItem("item-1"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.focusedId).toBeNull();
  });

  it("Delete key calls onDelete with focused id", () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNav({ itemIds: items, onDelete }),
    );
    act(() => result.current.selectItem("item-2"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    });
    expect(onDelete).toHaveBeenCalledWith("item-2");
  });

  it("Arrow keys call onMove with focused id and delta", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNav({ itemIds: items, onMove, moveStep: 10 }),
    );
    act(() => result.current.selectItem("item-1"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(onMove).toHaveBeenCalledWith("item-1", 10, 0);
  });

  it("does nothing when disabled", () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNav({ itemIds: items, onDelete, enabled: false }),
    );
    act(() => result.current.selectItem("item-1"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    });
    expect(onDelete).not.toHaveBeenCalled();
  });
});
