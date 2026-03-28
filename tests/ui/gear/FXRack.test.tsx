import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FXRack } from "@/components/gear/FXRack";

describe("FXRack", () => {
  it("renders with default label", () => {
    render(<FXRack />);
    expect(screen.getByText("FX Rack")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<FXRack label="Send FX" />);
    expect(screen.getByText("Send FX")).toBeInTheDocument();
  });

  it("renders SYNC button", () => {
    render(<FXRack />);
    expect(screen.getByText("SYNC")).toBeInTheDocument();
  });

  it("renders all four FX slots", () => {
    render(<FXRack />);
    expect(screen.getByText("ECHO")).toBeInTheDocument();
    expect(screen.getByText("REVERB")).toBeInTheDocument();
    expect(screen.getByText("FLANGER")).toBeInTheDocument();
    expect(screen.getByText("FILTER")).toBeInTheDocument();
  });

  it("toggle FX changes visual state", () => {
    render(<FXRack />);
    const echoBtn = screen.getByLabelText("Toggle ECHO");
    expect(echoBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(echoBtn);
    expect(echoBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("FILTER defaults to active", () => {
    render(<FXRack />);
    const filterBtn = screen.getByLabelText("Toggle FILTER");
    expect(filterBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("wet/dry slider has aria-label", () => {
    render(<FXRack />);
    expect(screen.getByLabelText("ECHO wet/dry")).toBeInTheDocument();
    expect(screen.getByLabelText("REVERB wet/dry")).toBeInTheDocument();
  });

  it("SYNC button toggles beat sync", () => {
    render(<FXRack />);
    const syncBtn = screen.getByLabelText("Beat sync toggle");
    expect(syncBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(syncBtn);
    expect(syncBtn).toHaveAttribute("aria-pressed", "false");
  });
});
