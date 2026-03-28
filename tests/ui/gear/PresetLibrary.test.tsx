import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PresetLibrary,
  BUILT_IN_PRESETS,
} from "@/components/gear/PresetLibrary";

describe("PresetLibrary", () => {
  let onLoadPreset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onLoadPreset = vi.fn();
  });

  it("renders all built-in presets", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    BUILT_IN_PRESETS.forEach((preset) => {
      expect(
        screen.getByRole("button", { name: new RegExp(preset.name) }),
      ).toBeTruthy();
    });
  });

  it("calls onLoadPreset when a preset card is clicked", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    const clubBtn = screen.getByRole("button", {
      name: /Club Standard/,
    });
    fireEvent.click(clubBtn);
    expect(onLoadPreset).toHaveBeenCalledWith(BUILT_IN_PRESETS[0].gear);
  });

  it("filters presets by search input", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    const searchInput = screen.getByRole("textbox", {
      name: /filter presets/i,
    });
    fireEvent.change(searchInput, { target: { value: "broadcast" } });
    expect(screen.getByText("Broadcast Studio")).toBeTruthy();
    expect(screen.queryByText("Mobile DJ")).toBeNull();
  });

  it("shows empty state when filter has no matches", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    const searchInput = screen.getByRole("textbox", {
      name: /filter presets/i,
    });
    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });
    expect(screen.getByText(/no presets match/i)).toBeTruthy();
  });

  it("filters presets by tag chips", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    const vinylTagBtn = screen.getByRole("button", { name: "vinyl" });
    fireEvent.click(vinylTagBtn);
    // Only turntablist has "vinyl" tag
    expect(screen.getByText("Turntablist")).toBeTruthy();
    expect(screen.queryByText("Club Standard")).toBeNull();
  });

  it("clears tag filter when same tag is clicked again", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    const vinylTagBtn = screen.getByRole("button", { name: "vinyl" });
    fireEvent.click(vinylTagBtn); // activate
    fireEvent.click(vinylTagBtn); // deactivate
    // All presets visible again
    expect(screen.getByText("Club Standard")).toBeTruthy();
    expect(screen.getByText("Turntablist")).toBeTruthy();
  });

  it("shows active state when activePresetId matches", () => {
    render(
      <PresetLibrary
        onLoadPreset={onLoadPreset}
        activePresetId="club-standard"
      />,
    );
    const card = screen.getByRole("button", {
      name: /Club Standard/,
    });
    expect(card.getAttribute("aria-current")).toBe("true");
  });

  it("has accessible region label", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    expect(screen.getByRole("region", { name: /gear presets/i })).toBeTruthy();
  });

  it("displays unit count on each preset card", () => {
    render(<PresetLibrary onLoadPreset={onLoadPreset} />);
    // Club Standard has 4 units
    expect(screen.getByText("4 units")).toBeTruthy();
  });
});
