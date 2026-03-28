import React, { useState } from "react";
import "./GearBottomPanel.css";

/**
 * GearBottomPanel — Collapsible tabbed panel at the bottom of the gear page.
 * Shows tabbed content: Presets, Signal Routing, Settings.
 * Slides up/down with smooth animation.
 */

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "presets", label: "Presets", icon: "📦" },
  { id: "routing", label: "Signal Flow", icon: "🔀" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

interface GearBottomPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const GearBottomPanel: React.FC<GearBottomPanelProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`gear-bottom-panel${isCollapsed ? " collapsed" : ""}`}>
      <div className="panel-tab-bar">
        <div
          role="tablist"
          aria-label="Gear panel tabs"
          className="panel-tabs-group"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`panel-tab${activeTab === tab.id ? " active" : ""}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => {
                onTabChange(tab.id);
                if (isCollapsed) setIsCollapsed(false);
              }}
            >
              <span className="panel-tab-icon">{tab.icon}</span>
              <span className="panel-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="panel-tab-spacer" />
        <button
          className="panel-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? "▲" : "▼"}
        </button>
      </div>

      <div
        className="panel-content"
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
      >
        {children}
      </div>
    </div>
  );
};

export default GearBottomPanel;
