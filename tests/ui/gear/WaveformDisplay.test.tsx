import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaveformDisplay } from "@/components/gear/WaveformDisplay";

// Mock canvas context
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
    shadowColor: "",
    shadowBlur: 0,
    fillStyle: "",
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    scale: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("WaveformDisplay", () => {
  it("renders a canvas element", () => {
    const { container } = render(<WaveformDisplay isPlaying={false} />);
    expect(container.querySelector("canvas.waveform-canvas")).toBeTruthy();
  });

  it("has accessible label", () => {
    render(<WaveformDisplay isPlaying={false} />);
    expect(screen.getByLabelText("Audio waveform visualization")).toBeTruthy();
  });

  it("shows playing badge when isPlaying is true", () => {
    render(<WaveformDisplay isPlaying={true} />);
    expect(screen.getByText("▶")).toBeTruthy();
  });

  it("does not show playing badge when paused", () => {
    render(<WaveformDisplay isPlaying={false} />);
    expect(screen.queryByText("▶")).toBeNull();
  });

  it("renders with custom height", () => {
    const { container } = render(
      <WaveformDisplay isPlaying={false} height={100} />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas?.style.height).toBe("100px");
  });

  it("accepts custom color prop", () => {
    // Should not throw with custom color
    const { container } = render(
      <WaveformDisplay isPlaying={false} color="#ff3d00" />,
    );
    expect(container.querySelector(".waveform-display")).toBeTruthy();
  });

  it("accepts bpm prop", () => {
    const { container } = render(
      <WaveformDisplay isPlaying={true} bpm={140} />,
    );
    expect(container.querySelector(".waveform-display")).toBeTruthy();
  });
});
