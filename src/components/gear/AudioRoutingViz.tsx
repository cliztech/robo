import React from "react";
import "./AudioRoutingViz.css";
import type { GearType } from "./gear.types";

/**
 * AudioRoutingViz — Displays the audio signal flow between gear units.
 * Shows which component routes audio to which (deck → mixer → master).
 * Visual-only for now; will connect to real audio graph in the future.
 */

interface RouteNode {
  id: string;
  label: string;
  type: GearType;
  icon: string;
}

interface RouteConnection {
  from: string;
  to: string;
  signal: "audio" | "sync" | "midi";
}

interface AudioRoutingVizProps {
  nodes: RouteNode[];
  connections: RouteConnection[];
}

const SIGNAL_COLORS: Record<string, string> = {
  audio: "#00e5ff",
  sync: "#7c4dff",
  midi: "#ff9100",
};

export const AudioRoutingViz: React.FC<AudioRoutingVizProps> = ({
  nodes,
  connections,
}) => {
  return (
    <div
      className="routing-viz"
      role="img"
      aria-label="Audio signal routing diagram"
    >
      <div className="routing-header">
        <span className="routing-title">SIGNAL ROUTING</span>
        <div className="routing-legend">
          <span className="legend-item">
            <span
              className="legend-dot"
              style={{ background: SIGNAL_COLORS.audio }}
            />
            Audio
          </span>
          <span className="legend-item">
            <span
              className="legend-dot"
              style={{ background: SIGNAL_COLORS.sync }}
            />
            Sync
          </span>
          <span className="legend-item">
            <span
              className="legend-dot"
              style={{ background: SIGNAL_COLORS.midi }}
            />
            MIDI
          </span>
        </div>
      </div>

      <div className="routing-flow">
        {nodes.map((node, idx) => (
          <React.Fragment key={node.id}>
            <div className="route-node">
              <span className="route-icon">{node.icon}</span>
              <span className="route-label">{node.label}</span>
              <span className="route-type">{node.type}</span>
            </div>
            {idx < nodes.length - 1 && (
              <div className="route-arrow">
                <div
                  className="arrow-line"
                  style={{
                    borderColor:
                      SIGNAL_COLORS[
                        connections.find((c) => c.from === node.id)?.signal ??
                          "audio"
                      ],
                  }}
                />
                <span className="arrow-head">→</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="routing-empty">No gear to route</div>
      )}
    </div>
  );
};

export default AudioRoutingViz;
