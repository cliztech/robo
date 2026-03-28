import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { SamplerPad } from "@/components/gear/SamplerPad";

describe("SamplerPad", () => {
  it("renders with default label", () => {
    render(<SamplerPad />);
    expect(screen.getByText("Sampler")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<SamplerPad label="Vocal Pad" />);
    expect(screen.getByText("Vocal Pad")).toBeInTheDocument();
  });

  it("renders all 8 pads", () => {
    render(<SamplerPad />);
    expect(screen.getByText("KICK")).toBeInTheDocument();
    expect(screen.getByText("SNARE")).toBeInTheDocument();
    expect(screen.getByText("CLAP")).toBeInTheDocument();
    expect(screen.getByText("HAT")).toBeInTheDocument();
    expect(screen.getByText("STAB")).toBeInTheDocument();
    expect(screen.getByText("FX1")).toBeInTheDocument();
    expect(screen.getByText("VOX")).toBeInTheDocument();
    expect(screen.getByText("DROP")).toBeInTheDocument();
  });

  it("pad buttons have trigger aria-labels", () => {
    render(<SamplerPad />);
    expect(screen.getByLabelText("Trigger KICK")).toBeInTheDocument();
    expect(screen.getByLabelText("Trigger DROP")).toBeInTheDocument();
  });

  it("bank buttons are rendered", () => {
    render(<SamplerPad />);
    expect(screen.getByLabelText("Bank A")).toBeInTheDocument();
    expect(screen.getByLabelText("Bank B")).toBeInTheDocument();
  });

  it("bank A is active by default", () => {
    render(<SamplerPad />);
    const bankA = screen.getByLabelText("Bank A");
    expect(bankA.className).toContain("active");
  });

  it("clicking bank B activates it", () => {
    render(<SamplerPad />);
    const bankB = screen.getByLabelText("Bank B");
    fireEvent.click(bankB);
    expect(bankB.className).toContain("active");
  });

  it("displays keyboard hint", () => {
    render(<SamplerPad />);
    expect(screen.getByText("Keys 1-8 to trigger")).toBeInTheDocument();
  });
});
