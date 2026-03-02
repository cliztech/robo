import React, { useMemo } from "react";
import "./AudioRoutingViz.css";
import type { GearType } from "./gear.types";

/**
 * AudioRoutingViz — Displays the audio signal flow between gear units.
 * Shows which component routes audio to which (deck → mixer → master).
 *
 * Phase 5: Auto-generates routing graph from placed gear; animated signal
 * pulses along the flow lines with color-coded signal types.
 */

export interface RouteNode {
  id: string;
  label: string;
  type: GearType;
  icon: string;
}

export interface RouteConnection {
  from: string;
  to: string;
  signal: "audio" | "sync" | "midi";
}

interface AudioRoutingVizProps {
  nodes: RouteNode[];
  connections: RouteConnection[];
  isLive?: boolean;
}

const SIGNAL_COLORS: Record<string, string> = {
  audio: "#00e5ff",
  sync: "#7c4dff",
  midi: "#ff9100",
};

const GEAR_ICONS: Record<GearType, string> = {
  DECK: "💿",
  MIXER: "🎚️",
  TURNTABLE: "🎵",
  FX: "✨",
  SAMPLER: "🥁",
};

/**
 * Auto-generate a basic routing graph from placed gear:
 * - DECKs / TURNTABLEs → first MIXER
 * - FX → first MIXER
 * - SAMPLER → first MIXER
 * - Add a virtual MASTER output after the mixer
 */
export function autoRoute(
  gearList: { type: GearType; label: string; instanceId: string }[],
): { nodes: RouteNode[]; connections: RouteConnection[] } {
  if (gearList.length === 0) return { nodes: [], connections: [] };

  const nodes: RouteNode[] = gearList.map((g) => ({
    id: g.instanceId,
    label: g.label,
    type: g.type,
    icon: GEAR_ICONS[g.type] ?? "❓",
  }));

  // Add virtual master output
  const masterId = "__master__";
  nodes.push({
    id: masterId,
    label: "Master Out",
    type: "MIXER",
    icon: "🔊",
  });

  const connections: RouteConnection[] = [];
  const mixerNode = gearList.find((g) => g.type === "MIXER");
  const mixerTarget = mixerNode?.instanceId ?? masterId;

  for (const g of gearList) {
    if (g.type === "MIXER") {
      // Mixer → Master
      connections.push({
        from: g.instanceId,
        to: masterId,
        signal: "audio",
      });
    } else if (g.type === "DECK" || g.type === "TURNTABLE") {
      connections.push({
        from: g.instanceId,
        to: mixerTarget,
        signal: "audio",
      });
    } else if (g.type === "FX") {
      connections.push({
        from: g.instanceId,
        to: mixerTarget,
        signal: "audio",
      });
    } else if (g.type === "SAMPLER") {
      connections.push({
        from: g.instanceId,
        to: mixerTarget,
        signal: "midi",
      });
    }
  }

  return { nodes, connections };
}

export const AudioRoutingViz: React.FC<AudioRoutingVizProps> = ({
  nodes,
  connections,
  isLive = false,
}) => {
  // Group nodes by layer for a cleaner flow layout
  const layers = useMemo(() => {
    const sources = nodes.filter(
      (n) =>
        n.type === "DECK" ||
        n.type === "TURNTABLE" ||
        n.type === "SAMPLER" ||
        n.type === "FX",
    );
    const mixers = nodes.filter(
      (n) => n.type === "MIXER" && n.id !== "__master__",
    );
    const master = nodes.filter((n) => n.id === "__master__");
    return [sources, mixers, master].filter((l) => l.length > 0);
  }, [nodes]);

  return (
    <div
      className={`routing-viz${isLive ? " live" : ""}`}
      role="img"
      aria-label="Audio signal routing diagram"
    >
      <div className="routing-header">
        <span className="routing-title">SIGNAL ROUTING</span>
        <div className="routing-legend">
          {Object.entries(SIGNAL_COLORS).map(([type, color]) => (
            <span key={type} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
          {isLive && <span className="routing-live-badge">● LIVE</span>}
        </div>
      </div>

      <div className="routing-flow-layered">
        {layers.map((layer, layerIdx) => (
          <React.Fragment key={layerIdx}>
            <div className="routing-layer">
              {layer.map((node) => {
                const outConn = connections.find((c) => c.from === node.id);
                return (
                  <div
                    key={node.id}
                    className="route-node"
                    data-signal={outConn?.signal ?? "audio"}
                  >
                    <span className="route-icon">{node.icon}</span>
                    <span className="route-label">{node.label}</span>
                    <span className="route-type">{node.type}</span>
                    {isLive && <span className="route-signal-indicator" />}
                  </div>
                );
              })}
            </div>
            {layerIdx < layers.length - 1 && (
              <div className="routing-arrows">
                {layer.map((node) => {
                  const conn = connections.find((c) => c.from === node.id);
                  if (!conn) return null;
                  return (
                    <div key={node.id} className="route-arrow">
                      <div
                        className={`arrow-line${isLive ? " animated" : ""}`}
                        style={{
                          borderColor: SIGNAL_COLORS[conn.signal],
                        }}
                      />
                      <span
                        className="arrow-head"
                        style={{
                          color: SIGNAL_COLORS[conn.signal],
                        }}
                      >
                        →
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="routing-empty">
          Add gear to see the signal routing diagram
        </div>
      )}
    </div>
  );
};

export default AudioRoutingViz;
