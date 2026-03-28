import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GearBottomPanel } from "@/components/gear/GearBottomPanel";

describe("GearBottomPanel", () => {
  it("renders all three tabs", () => {
    render(
      <GearBottomPanel activeTab="presets" onTabChange={vi.fn()}>
        <div>Content</div>
      </GearBottomPanel>,
    );
    expect(screen.getByRole("tab", { name: /presets/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /signal flow/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /settings/i })).toBeTruthy();
  });

  it("marks active tab with aria-selected", () => {
    render(
      <GearBottomPanel activeTab="routing" onTabChange={vi.fn()}>
        <div>Content</div>
      </GearBottomPanel>,
    );
    const routingTab = screen.getByRole("tab", { name: /signal flow/i });
    expect(routingTab.getAttribute("aria-selected")).toBe("true");
  });

  it("calls onTabChange when a tab is clicked", () => {
    const onTabChange = vi.fn();
    render(
      <GearBottomPanel activeTab="presets" onTabChange={onTabChange}>
        <div>Content</div>
      </GearBottomPanel>,
    );
    fireEvent.click(screen.getByRole("tab", { name: /settings/i }));
    expect(onTabChange).toHaveBeenCalledWith("settings");
  });

  it("renders children content", () => {
    render(
      <GearBottomPanel activeTab="presets" onTabChange={vi.fn()}>
        <div>Test Content Here</div>
      </GearBottomPanel>,
    );
    expect(screen.getByText("Test Content Here")).toBeTruthy();
  });

  it("collapses and expands via collapse button", () => {
    const { container } = render(
      <GearBottomPanel activeTab="presets" onTabChange={vi.fn()}>
        <div>Content</div>
      </GearBottomPanel>,
    );
    const collapseBtn = screen.getByRole("button", {
      name: /collapse panel/i,
    });
    fireEvent.click(collapseBtn);
    expect(
      container
        .querySelector(".gear-bottom-panel")
        ?.classList.contains("collapsed"),
    ).toBe(true);

    const expandBtn = screen.getByRole("button", {
      name: /expand panel/i,
    });
    fireEvent.click(expandBtn);
    expect(
      container
        .querySelector(".gear-bottom-panel")
        ?.classList.contains("collapsed"),
    ).toBe(false);
  });

  it("has proper tablist role", () => {
    render(
      <GearBottomPanel activeTab="presets" onTabChange={vi.fn()}>
        <div>Content</div>
      </GearBottomPanel>,
    );
    expect(
      screen.getByRole("tablist", { name: /gear panel tabs/i }),
    ).toBeTruthy();
  });
});
