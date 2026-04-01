import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { VintageMixer } from "@/components/gear/VintageMixer";

describe("VintageMixer", () => {
  it("renders with default label", () => {
    render(<VintageMixer />);
    expect(screen.getByText("Master Mixer")).toBeInTheDocument();
    expect(screen.getByText("MST")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<VintageMixer label="Sub Mixer" />);
    expect(screen.getByText("Sub Mixer")).toBeInTheDocument();
  });

  it("renders all 4 channel faders with aria-labels", () => {
    render(<VintageMixer />);
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByLabelText(`Channel ${i} volume`)).toBeInTheDocument();
    }
  });

  it("renders crossfader with aria-label", () => {
    render(<VintageMixer />);
    expect(screen.getByLabelText("Crossfader")).toBeInTheDocument();
  });

  it("channel fader updates on input", () => {
    render(<VintageMixer />);
    const fader = screen.getByLabelText("Channel 1 volume") as HTMLInputElement;
    fireEvent.change(fader, { target: { value: "90" } });
    expect(fader.value).toBe("90");
  });

  it("crossfader updates on input", () => {
    render(<VintageMixer />);
    const cf = screen.getByLabelText("Crossfader") as HTMLInputElement;
    fireEvent.change(cf, { target: { value: "25" } });
    expect(cf.value).toBe("25");
  });

  it("renders channel labels CH 1 through CH 4", () => {
    render(<VintageMixer />);
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(`CH ${i}`)).toBeInTheDocument();
    }
  });
});
