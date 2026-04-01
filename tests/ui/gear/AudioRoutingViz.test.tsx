import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioRoutingViz, autoRoute } from "@/components/gear/AudioRoutingViz";
import type {
  RouteNode,
  RouteConnection,
} from "@/components/gear/AudioRoutingViz";

describe("AudioRoutingViz", () => {
  const sampleNodes: RouteNode[] = [
    { id: "deck-a", label: "Deck A", type: "DECK", icon: "💿" },
    { id: "mixer", label: "Mixer", type: "MIXER", icon: "🎚️" },
    { id: "__master__", label: "Master Out", type: "MIXER", icon: "🔊" },
  ];

  const sampleConnections: RouteConnection[] = [
    { from: "deck-a", to: "mixer", signal: "audio" },
    { from: "mixer", to: "__master__", signal: "audio" },
  ];

  it("renders route nodes with labels", () => {
    render(
      <AudioRoutingViz nodes={sampleNodes} connections={sampleConnections} />,
    );
    expect(screen.getByText("Deck A")).toBeTruthy();
    expect(screen.getByText("Mixer")).toBeTruthy();
    expect(screen.getByText("Master Out")).toBeTruthy();
  });

  it("shows empty state when no nodes", () => {
    render(<AudioRoutingViz nodes={[]} connections={[]} />);
    expect(screen.getByText(/add gear to see/i)).toBeTruthy();
  });

  it("displays signal type legend", () => {
    render(
      <AudioRoutingViz nodes={sampleNodes} connections={sampleConnections} />,
    );
    expect(screen.getByText("Audio")).toBeTruthy();
    expect(screen.getByText("Sync")).toBeTruthy();
    expect(screen.getByText("MIDI")).toBeTruthy();
  });

  it("shows LIVE badge when isLive is true", () => {
    render(
      <AudioRoutingViz
        nodes={sampleNodes}
        connections={sampleConnections}
        isLive={true}
      />,
    );
    expect(screen.getByText("● LIVE")).toBeTruthy();
  });

  it("does not show LIVE badge by default", () => {
    render(
      <AudioRoutingViz nodes={sampleNodes} connections={sampleConnections} />,
    );
    expect(screen.queryByText("● LIVE")).toBeNull();
  });

  it("has accessible img role with label", () => {
    render(
      <AudioRoutingViz nodes={sampleNodes} connections={sampleConnections} />,
    );
    expect(
      screen.getByRole("img", { name: /audio signal routing/i }),
    ).toBeTruthy();
  });

  it("renders arrows between layers", () => {
    const { container } = render(
      <AudioRoutingViz nodes={sampleNodes} connections={sampleConnections} />,
    );
    const arrows = container.querySelectorAll(".arrow-head");
    expect(arrows.length).toBeGreaterThan(0);
  });
});

describe("autoRoute", () => {
  it("returns empty graph for empty gear list", () => {
    const result = autoRoute([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.connections).toHaveLength(0);
  });

  it("routes decks to mixer and mixer to master", () => {
    const gear = [
      { type: "DECK" as const, label: "Deck A", instanceId: "d1" },
      { type: "MIXER" as const, label: "Mixer", instanceId: "m1" },
    ];
    const result = autoRoute(gear);
    // 2 gear + 1 virtual master
    expect(result.nodes).toHaveLength(3);
    // deck→mixer + mixer→master
    expect(result.connections).toHaveLength(2);
  });

  it("routes sampler with midi signal type", () => {
    const gear = [
      { type: "SAMPLER" as const, label: "Pad", instanceId: "s1" },
      { type: "MIXER" as const, label: "Mixer", instanceId: "m1" },
    ];
    const result = autoRoute(gear);
    const samplerConn = result.connections.find((c) => c.from === "s1");
    expect(samplerConn?.signal).toBe("midi");
  });

  it("connects all sources to mixer when present", () => {
    const gear = [
      { type: "DECK" as const, label: "Deck A", instanceId: "d1" },
      { type: "TURNTABLE" as const, label: "TT", instanceId: "t1" },
      { type: "FX" as const, label: "FX", instanceId: "f1" },
      { type: "MIXER" as const, label: "Mix", instanceId: "m1" },
    ];
    const result = autoRoute(gear);
    const toMixer = result.connections.filter((c) => c.to === "m1");
    // deck, turntable, fx all connect to mixer
    expect(toMixer).toHaveLength(3);
  });
});
