export const BUILT_IN_LAYOUT_PRESET_NAMES = [
  "Broadcast",
  "Mixing",
  "Production",
  "Minimal",
] as const;

export type BuiltInLayoutPresetName = (typeof BUILT_IN_LAYOUT_PRESET_NAMES)[number];

export type LayoutPanelId =
  | "waveform_a"
  | "waveform_b"
  | "deck_a"
  | "deck_b"
  | "mixer"
  | "library"
  | "performance";

export interface PanelPosition {
  row: number;
  column: number;
  row_span: number;
  column_span: number;
}

export interface LayoutPanelState {
  id: LayoutPanelId;
  title: string;
  visible: boolean;
  position: PanelPosition;
  stack_id?: string;
}

export interface LayoutSplitRatios {
  left: number;
  center: number;
  right: number;
}

export interface LayoutTabStack {
  id: string;
  panel_ids: LayoutPanelId[];
  active_panel_id: LayoutPanelId;
}

export interface ConsoleLayoutModel {
  name: string;
  is_locked: boolean;
  panel_visibility: Record<LayoutPanelId, boolean>;
  panels: Record<LayoutPanelId, LayoutPanelState>;
  split_ratios: LayoutSplitRatios;
  tab_stacks: Record<string, LayoutTabStack>;
}

const basePanels: Record<LayoutPanelId, LayoutPanelState> = {
  waveform_a: {
    id: "waveform_a",
    title: "Waveform Rail A",
    visible: true,
    position: { row: 1, column: 1, row_span: 1, column_span: 3 },
  },
  waveform_b: {
    id: "waveform_b",
    title: "Waveform Rail B",
    visible: true,
    position: { row: 1, column: 4, row_span: 1, column_span: 3 },
  },
  deck_a: {
    id: "deck_a",
    title: "Deck A Transport",
    visible: true,
    position: { row: 2, column: 1, row_span: 1, column_span: 2 },
  },
  mixer: {
    id: "mixer",
    title: "Mixer + Crossfader",
    visible: true,
    position: { row: 2, column: 3, row_span: 2, column_span: 2 },
  },
  deck_b: {
    id: "deck_b",
    title: "Deck B Transport",
    visible: true,
    position: { row: 2, column: 5, row_span: 1, column_span: 2 },
  },
  library: {
    id: "library",
    title: "Browser / Library",
    visible: true,
    position: { row: 3, column: 1, row_span: 1, column_span: 2 },
  },
  performance: {
    id: "performance",
    title: "Performance + FX",
    visible: true,
    position: { row: 3, column: 5, row_span: 1, column_span: 2 },
  },
};

const defaultTabs: Record<string, LayoutTabStack> = {
  lower_right: {
    id: "lower_right",
    panel_ids: ["performance"],
    active_panel_id: "performance",
  },
};

const defaultsByPreset: Record<BuiltInLayoutPresetName, ConsoleLayoutModel> = {
  Broadcast: {
    name: "Broadcast",
    is_locked: true,
    panel_visibility: {
      waveform_a: true,
      waveform_b: true,
      deck_a: true,
      deck_b: true,
      mixer: true,
      library: true,
      performance: false,
    },
    panels: {
      ...basePanels,
      library: {
        ...basePanels.library,
        position: { row: 3, column: 1, row_span: 1, column_span: 6 },
      },
    },
    split_ratios: { left: 1, center: 1.25, right: 1 },
    tab_stacks: defaultTabs,
  },
  Mixing: {
    name: "Mixing",
    is_locked: false,
    panel_visibility: {
      waveform_a: true,
      waveform_b: true,
      deck_a: true,
      deck_b: true,
      mixer: true,
      library: false,
      performance: true,
    },
    panels: {
      ...basePanels,
      performance: {
        ...basePanels.performance,
        position: { row: 3, column: 1, row_span: 1, column_span: 6 },
      },
    },
    split_ratios: { left: 0.95, center: 1.4, right: 0.95 },
    tab_stacks: defaultTabs,
  },
  Production: {
    name: "Production",
    is_locked: false,
    panel_visibility: {
      waveform_a: true,
      waveform_b: true,
      deck_a: false,
      deck_b: false,
      mixer: true,
      library: true,
      performance: true,
    },
    panels: {
      ...basePanels,
      mixer: {
        ...basePanels.mixer,
        position: { row: 2, column: 3, row_span: 2, column_span: 4 },
      },
      library: {
        ...basePanels.library,
        position: { row: 2, column: 1, row_span: 2, column_span: 2 },
      },
      performance: {
        ...basePanels.performance,
        position: { row: 1, column: 1, row_span: 1, column_span: 2 },
      },
    },
    split_ratios: { left: 0.9, center: 1.5, right: 1.1 },
    tab_stacks: {
      left_ops: {
        id: "left_ops",
        panel_ids: ["library", "performance"],
        active_panel_id: "library",
      },
    },
  },
  Minimal: {
    name: "Minimal",
    is_locked: true,
    panel_visibility: {
      waveform_a: true,
      waveform_b: false,
      deck_a: true,
      deck_b: false,
      mixer: true,
      library: false,
      performance: false,
    },
    panels: {
      ...basePanels,
      waveform_a: {
        ...basePanels.waveform_a,
        position: { row: 1, column: 1, row_span: 1, column_span: 6 },
      },
      deck_a: {
        ...basePanels.deck_a,
        position: { row: 2, column: 1, row_span: 1, column_span: 3 },
      },
      mixer: {
        ...basePanels.mixer,
        position: { row: 2, column: 4, row_span: 1, column_span: 3 },
      },
    },
    split_ratios: { left: 1, center: 1, right: 1 },
    tab_stacks: defaultTabs,
  },
};

export function createBuiltInLayoutPreset(name: BuiltInLayoutPresetName): ConsoleLayoutModel {
  return structuredClone(defaultsByPreset[name]);
}
