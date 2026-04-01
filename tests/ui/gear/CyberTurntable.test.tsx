import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CyberTurntable } from "@/components/gear/CyberTurntable";

describe("CyberTurntable", () => {
  it("renders with default label", () => {
    render(<CyberTurntable />);
    expect(screen.getByText("Deck A")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<CyberTurntable label="Deck B" />);
    expect(screen.getByText("Deck B")).toBeInTheDocument();
  });

  it("defaults to BPM 128.0", () => {
    render(<CyberTurntable />);
    expect(screen.getByText("128.0 BPM")).toBeInTheDocument();
  });

  it("uses syncState BPM when provided", () => {
    render(
      <CyberTurntable
        syncState={{ bpm: 140.0, pitch: 0, isMaster: false, phase: 0 }}
      />,
    );
    expect(screen.getByText("140.0 BPM")).toBeInTheDocument();
  });

  it("shows START button initially", () => {
    render(<CyberTurntable />);
    expect(screen.getByText("START")).toBeInTheDocument();
  });

  it("toggles to STOP when started", () => {
    render(<CyberTurntable />);
    fireEvent.click(screen.getByText("START"));
    expect(screen.getByText("STOP")).toBeInTheDocument();
  });

  it("toggles back to START when stopped", () => {
    render(<CyberTurntable />);
    fireEvent.click(screen.getByText("START"));
    fireEvent.click(screen.getByText("STOP"));
    expect(screen.getByText("START")).toBeInTheDocument();
  });

  it("renders speed selector buttons", () => {
    render(<CyberTurntable />);
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("DGN label is shown on vinyl", () => {
    render(<CyberTurntable />);
    expect(screen.getByText("DGN")).toBeInTheDocument();
  });
});
