import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PlatinumCDJ } from "@/components/gear/PlatinumCDJ";

describe("PlatinumCDJ", () => {
  it("renders with default props", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" />);
    expect(screen.getByText("Deck A")).toBeInTheDocument();
    expect(screen.getByText("BPM")).toBeInTheDocument();
    expect(screen.getByText("PLAY")).toBeInTheDocument();
    expect(screen.getByText("CUE")).toBeInTheDocument();
  });

  it("displays provided BPM value", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" bpm={140.5} />);
    expect(screen.getByText("140.5")).toBeInTheDocument();
  });

  it("toggles play/pause on button click", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" />);
    const playBtn = screen.getByText("PLAY");
    fireEvent.click(playBtn);
    expect(screen.getByText("PAUSE")).toBeInTheDocument();
    fireEvent.click(screen.getByText("PAUSE"));
    expect(screen.getByText("PLAY")).toBeInTheDocument();
  });

  it("CUE button stops playback", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" />);
    fireEvent.click(screen.getByText("PLAY"));
    expect(screen.getByText("PAUSE")).toBeInTheDocument();
    fireEvent.click(screen.getByText("CUE"));
    expect(screen.getByText("PLAY")).toBeInTheDocument();
  });

  it("shows pitch value with sign", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" pitch={2.5} />);
    expect(screen.getByText("+2.50%")).toBeInTheDocument();
  });

  it("shows negative pitch without plus sign", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" pitch={-1.2} />);
    expect(screen.getByText("-1.20%")).toBeInTheDocument();
  });

  it("applies active class when playing", () => {
    render(<PlatinumCDJ deckId="deck-a" label="Deck A" />);
    const playBtn = screen.getByText("PLAY");
    fireEvent.click(playBtn);
    expect(screen.getByText("PAUSE").closest("button")).toHaveClass("active");
  });
});
