import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GearSettings, DEFAULT_SETTINGS } from "@/components/gear/GearSettings";

describe("GearSettings", () => {
  it("renders all setting controls", () => {
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={vi.fn()} />);
    expect(screen.getByText("Grid Snap")).toBeTruthy();
    expect(screen.getByText("Show Labels")).toBeTruthy();
    expect(screen.getByText("Auto-Route Signal")).toBeTruthy();
    expect(screen.getByText("Metering")).toBeTruthy();
    expect(screen.getByText("Accent Color")).toBeTruthy();
  });

  it("toggles grid snap and calls onChange", () => {
    const onChange = vi.fn();
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const toggle = screen.getByRole("switch", { name: /grid snap/i });
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ gridSnap: false }),
    );
  });

  it("toggles show labels", () => {
    const onChange = vi.fn();
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const toggle = screen.getByRole("switch", { name: /show labels/i });
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ showLabels: false }),
    );
  });

  it("changes metering mode via segmented control", () => {
    const onChange = vi.fn();
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const rmsBtn = screen.getByRole("radio", { name: "RMS" });
    fireEvent.click(rmsBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ meteringMode: "rms" }),
    );
  });

  it("changes accent color via swatch", () => {
    const onChange = vi.fn();
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const purpleBtn = screen.getByRole("radio", {
      name: /purple accent/i,
    });
    fireEvent.click(purpleBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: "#7c4dff" }),
    );
  });

  it("has accessible form label", () => {
    render(<GearSettings settings={DEFAULT_SETTINGS} onChange={vi.fn()} />);
    expect(screen.getByRole("form", { name: /studio settings/i })).toBeTruthy();
  });

  it("shows correct initial state for toggles", () => {
    render(
      <GearSettings
        settings={{ ...DEFAULT_SETTINGS, gridSnap: false }}
        onChange={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("switch", { name: /grid snap/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});
