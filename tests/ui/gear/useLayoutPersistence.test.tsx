import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLayoutPersistence } from "@/components/gear/hooks/useLayoutPersistence";
import type { GearType } from "@/components/gear/gear.types";

// Mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("useLayoutPersistence", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with empty layouts", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    expect(result.current.layouts).toEqual([]);
    expect(result.current.activeLayoutId).toBeNull();
  });

  it("saves a layout", () => {
    const { result } = renderHook(() => useLayoutPersistence());

    const gear = [
      {
        instanceId: "g1",
        type: "DECK" as GearType,
        label: "Deck A",
        gridColumn: 0,
        gridRow: 0,
      },
    ];

    act(() => {
      result.current.saveLayout("Test Setup", gear);
    });

    expect(result.current.layouts).toHaveLength(1);
    expect(result.current.layouts[0].name).toBe("Test Setup");
    expect(result.current.layouts[0].gear).toEqual(gear);
    expect(result.current.activeLayoutId).toBe(result.current.layouts[0].id);
  });

  it("loads a saved layout", () => {
    const { result } = renderHook(() => useLayoutPersistence());

    const gear = [
      {
        instanceId: "g1",
        type: "MIXER" as GearType,
        label: "Mixer",
        gridColumn: 0,
        gridRow: 0,
      },
    ];

    let savedId = "";
    act(() => {
      const layout = result.current.saveLayout("Club Mix", gear);
      savedId = layout.id;
    });

    const loaded = result.current.loadLayout(savedId);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("Club Mix");
  });

  it("deletes a layout", () => {
    const { result } = renderHook(() => useLayoutPersistence());

    let savedId = "";
    act(() => {
      const layout = result.current.saveLayout("Delete Me", []);
      savedId = layout.id;
    });

    expect(result.current.layouts).toHaveLength(1);

    act(() => {
      result.current.deleteLayout(savedId);
    });

    expect(result.current.layouts).toHaveLength(0);
    expect(result.current.activeLayoutId).toBeNull();
  });

  it("lists all saved layouts", () => {
    const { result } = renderHook(() => useLayoutPersistence());

    act(() => {
      result.current.saveLayout("Layout A", []);
      result.current.saveLayout("Layout B", []);
    });

    const list = result.current.listLayouts();
    expect(list).toHaveLength(2);
  });
});
