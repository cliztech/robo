import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VUMeter } from "@/components/gear/VUMeter";

describe("VUMeter", () => {
  it("renders with vertical orientation by default", () => {
    const { container } = render(<VUMeter level={0.5} />);
    expect(container.querySelector(".vu-meter-unit.vertical")).toBeTruthy();
  });

  it("renders with horizontal orientation", () => {
    const { container } = render(
      <VUMeter level={0.5} orientation="horizontal" />,
    );
    expect(container.querySelector(".vu-meter-unit.horizontal")).toBeTruthy();
  });

  it("displays label when provided", () => {
    render(<VUMeter level={0.5} label="L" />);
    expect(screen.getByText("L")).toBeTruthy();
  });

  it("has accessible meter role", () => {
    render(<VUMeter level={0.7} label="Volume" />);
    expect(
      screen.getByRole("meter", { name: /volume audio level/i }),
    ).toBeTruthy();
  });

  it("shows off state when mode is off", () => {
    const { container } = render(<VUMeter level={0.5} mode="off" />);
    expect(container.querySelector(".vu-bar.off")).toBeTruthy();
  });

  it("applies green color for low level", () => {
    const { container } = render(<VUMeter level={0.3} />);
    expect(container.querySelector(".vu-bar.green")).toBeTruthy();
  });

  it("applies yellow color for mid level", () => {
    const { container } = render(<VUMeter level={0.75} />);
    expect(container.querySelector(".vu-bar.yellow")).toBeTruthy();
  });

  it("applies red color for high level", () => {
    const { container } = render(<VUMeter level={0.95} />);
    expect(container.querySelector(".vu-bar.red")).toBeTruthy();
  });

  it("shows peak hold indicator in peak mode", () => {
    const { container } = render(
      <VUMeter level={0.5} peakLevel={0.8} mode="peak" />,
    );
    expect(container.querySelector(".vu-peak-hold")).toBeTruthy();
  });

  it("does not show peak hold in rms mode", () => {
    const { container } = render(<VUMeter level={0.5} mode="rms" />);
    expect(container.querySelector(".vu-peak-hold")).toBeNull();
  });
});
