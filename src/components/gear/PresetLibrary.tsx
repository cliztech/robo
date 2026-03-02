import React, { useState, useCallback } from "react";
import "./PresetLibrary.css";
import type { GearType } from "./gear.types";

/**
 * PresetLibrary — Built-in DJ setup presets that users can one-click load.
 * Each preset defines a curated collection of gear units arranged for
 * a specific use case (Club, Home, Mobile, Broadcast).
 *
 * Phase 5: Enhanced with active tracking, tag filtering, and gear badges.
 */

export interface PresetGear {
  type: GearType;
  label: string;
}

export interface GearPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  gear: PresetGear[];
}

export const BUILT_IN_PRESETS: GearPreset[] = [
  {
    id: "club-standard",
    name: "Club Standard",
    description: "2x CDJ + Mixer + FX — the industry standard DJ booth",
    icon: "🏢",
    tags: ["club", "professional", "standard"],
    gear: [
      { type: "DECK", label: "Deck A" },
      { type: "DECK", label: "Deck B" },
      { type: "MIXER", label: "Club Mixer" },
      { type: "FX", label: "Send FX" },
    ],
  },
  {
    id: "turntablist",
    name: "Turntablist",
    description: "2x Turntable + Mixer + Sampler — vinyl scratch battle setup",
    icon: "🎵",
    tags: ["vinyl", "scratch", "turntablism"],
    gear: [
      { type: "TURNTABLE", label: "Turntable L" },
      { type: "TURNTABLE", label: "Turntable R" },
      { type: "MIXER", label: "Battle Mixer" },
      { type: "SAMPLER", label: "Sample Bank" },
    ],
  },
  {
    id: "home-producer",
    name: "Home Producer",
    description:
      "CDJ + Turntable + Mixer + Sampler + FX — creative production setup",
    icon: "🏠",
    tags: ["home", "production", "creative"],
    gear: [
      { type: "DECK", label: "Deck A" },
      { type: "TURNTABLE", label: "Vinyl Deck" },
      { type: "MIXER", label: "Studio Mixer" },
      { type: "SAMPLER", label: "Drum Pad" },
      { type: "FX", label: "FX Chain" },
    ],
  },
  {
    id: "mobile-dj",
    name: "Mobile DJ",
    description: "2x CDJ + Mixer — minimal rig for mobile gigs",
    icon: "🚐",
    tags: ["mobile", "minimal", "portable"],
    gear: [
      { type: "DECK", label: "Deck A" },
      { type: "DECK", label: "Deck B" },
      { type: "MIXER", label: "Compact Mixer" },
    ],
  },
  {
    id: "broadcast-studio",
    name: "Broadcast Studio",
    description:
      "Full broadcast setup — 2x CDJ + Mixer + FX + Sampler for radio",
    icon: "📡",
    tags: ["broadcast", "radio", "professional"],
    gear: [
      { type: "DECK", label: "On-Air Deck A" },
      { type: "DECK", label: "On-Air Deck B" },
      { type: "MIXER", label: "Broadcast Mixer" },
      { type: "FX", label: "Broadcast FX" },
      { type: "SAMPLER", label: "Jingle Pad" },
    ],
  },
  {
    id: "four-deck",
    name: "Four Deck Monster",
    description: "4x CDJ + Mixer + 2x FX — advanced multi-deck setup",
    icon: "💎",
    tags: ["advanced", "multi-deck", "professional"],
    gear: [
      { type: "DECK", label: "Deck A" },
      { type: "DECK", label: "Deck B" },
      { type: "DECK", label: "Deck C" },
      { type: "DECK", label: "Deck D" },
      { type: "MIXER", label: "Master Mixer" },
      { type: "FX", label: "FX Unit 1" },
      { type: "FX", label: "FX Unit 2" },
    ],
  },
];

/** Collect all unique tags for filter chips */
const ALL_TAGS = [...new Set(BUILT_IN_PRESETS.flatMap((p) => p.tags))];

interface PresetLibraryProps {
  onLoadPreset: (gear: PresetGear[]) => void;
  activePresetId?: string;
}

export const PresetLibrary: React.FC<PresetLibraryProps> = ({
  onLoadPreset,
  activePresetId,
}) => {
  const [filter, setFilter] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = BUILT_IN_PRESETS.filter((p) => {
    const matchesSearch =
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.tags.some((t) => t.includes(filter.toLowerCase()));
    const matchesTag = !activeTag || p.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }, []);

  const handleLoadPreset = useCallback(
    (preset: GearPreset) => {
      onLoadPreset(preset.gear);
    },
    [onLoadPreset],
  );

  return (
    <div className="preset-library" role="region" aria-label="Gear presets">
      <div className="preset-header">
        <h2 className="preset-title">PRESETS</h2>
        <input
          className="preset-search"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter presets"
        />
      </div>

      {/* Tag chips */}
      <div className="preset-tags" role="group" aria-label="Preset tags">
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            className={`preset-tag${activeTag === tag ? " active" : ""}`}
            onClick={() => handleTagClick(tag)}
            aria-pressed={activeTag === tag}
          >
            {tag}
          </button>
        ))}
        {activeTag && (
          <button
            className="preset-tag clear-tag"
            onClick={() => setActiveTag(null)}
            aria-label="Clear tag filter"
          >
            ✕
          </button>
        )}
      </div>

      <div className="preset-grid">
        {filtered.map((preset) => (
          <button
            key={preset.id}
            className={`preset-card${activePresetId === preset.id ? " active" : ""}`}
            onClick={() => handleLoadPreset(preset)}
            aria-label={`Load ${preset.name} preset`}
            aria-current={activePresetId === preset.id ? "true" : undefined}
          >
            <div className="preset-card-icon">{preset.icon}</div>
            <div className="preset-card-info">
              <span className="preset-card-name">{preset.name}</span>
              <span className="preset-card-desc">{preset.description}</span>
              <div className="preset-card-meta">
                <span className="preset-card-gear">
                  {preset.gear.length} units
                </span>
                <span className="preset-card-tags">
                  {preset.tags.map((t) => (
                    <span key={t} className="preset-micro-tag">
                      {t}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            {activePresetId === preset.id && (
              <span className="preset-active-badge" aria-hidden="true">
                ●
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="preset-empty">No presets match "{filter}"</div>
      )}
    </div>
  );
};

export default PresetLibrary;
