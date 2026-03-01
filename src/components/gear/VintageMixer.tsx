import React, { useState } from "react";
import "./VintageMixer.css";
import type { GearUnitProps } from "./gear.types";

/**
 * VintageMixer — A 4-channel analog-style mixer with VU meters.
 * SGE Gear Unit (mod-drop v1.0) — Skin: VINTAGE
 */
export const VintageMixer: React.FC<Partial<GearUnitProps>> = ({
  id = "mixer-1",
  label = "Master Mixer",
}) => {
  const [channels, setChannels] = useState([75, 60, 80, 50]);
  const [crossfader, setCrossfader] = useState(50);
  const [masterVol, setMasterVol] = useState(85);

  const updateChannel = (idx: number, val: number) => {
    setChannels((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  return (
    <div className="vintage-mixer gear-unit">
      <div className="mixer-header">
        <div className="mixer-label">{label}</div>
        <div className="master-indicator">MST</div>
      </div>

      {/* VU Meters */}
      <div className="vu-meters">
        <div className="vu-meter">
          <div
            className="vu-fill left"
            style={{ height: `${channels[0] * 0.8}%` }}
          />
          <span className="vu-tag">L</span>
        </div>
        <div className="vu-meter">
          <div
            className="vu-fill right"
            style={{ height: `${channels[1] * 0.8}%` }}
          />
          <span className="vu-tag">R</span>
        </div>
      </div>

      {/* Channel Faders */}
      <div className="channel-strip-row">
        {channels.map((vol, i) => (
          <div className="channel-strip" key={i}>
            <div className="eq-knobs">
              <div className="knob hi" title="HI" />
              <div className="knob mid" title="MID" />
              <div className="knob lo" title="LO" />
            </div>
            <div className="fader-track">
              <input
                type="range"
                className="channel-fader"
                min={0}
                max={100}
                value={vol}
                orient="vertical"
                onChange={(e) => updateChannel(i, Number(e.target.value))}
                aria-label={`Channel ${i + 1} volume`}
              />
            </div>
            <div className="channel-label">CH {i + 1}</div>
          </div>
        ))}
      </div>

      {/* Crossfader */}
      <div className="crossfader-section">
        <span className="cf-label">A</span>
        <input
          type="range"
          className="crossfader"
          min={0}
          max={100}
          value={crossfader}
          onChange={(e) => setCrossfader(Number(e.target.value))}
          aria-label="Crossfader"
        />
        <span className="cf-label">B</span>
      </div>

      {/* Master Volume */}
      <div className="master-section">
        <div className="master-knob-container">
          <div
            className="master-knob"
            style={{ transform: `rotate(${(masterVol / 100) * 270 - 135}deg)` }}
          >
            <div className="knob-notch" />
          </div>
        </div>
        <div className="master-label">MASTER</div>
      </div>

      <div className="vintage-border-accent" />
    </div>
  );
};

export default VintageMixer;
