/**
 * SGE Gear Component Library — Barrel Export
 * Import all gear units from this single entry point.
 */

// Types
export type {
    GearType,
    GearSkin,
    GearSyncState,
    GearUnitProps,
    StageSlot,
    StudioLayout,
} from './gear.types';
export { DEFAULT_SYNC } from './gear.types';

// Gear Units
export { PlatinumCDJ } from './PlatinumCDJ';
export { VintageMixer } from './VintageMixer';
export { CyberTurntable } from './CyberTurntable';
export { FXRack } from './FXRack';
export { SamplerPad } from './SamplerPad';
export { VUMeter } from './VUMeter';

// Layout Engine
export { StudioStage } from './StudioStage';

// Panels
export { PresetLibrary, BUILT_IN_PRESETS } from './PresetLibrary';
export type { PresetGear, GearPreset } from './PresetLibrary';
export { AudioRoutingViz, autoRoute } from './AudioRoutingViz';
export type { RouteNode, RouteConnection } from './AudioRoutingViz';
export { GearBottomPanel } from './GearBottomPanel';
export { GearSettings, DEFAULT_SETTINGS } from './GearSettings';
export type { StudioSettings } from './GearSettings';

// Hooks
export { useGearAudio } from './hooks/useGearAudio';
export { useLayoutPersistence } from './hooks/useLayoutPersistence';
export type { PersistedGear, PersistedLayout } from './hooks/useLayoutPersistence';
export { useAudioEngineBridge } from './hooks/useAudioEngineBridge';
export type { EngineStatus } from './hooks/useAudioEngineBridge';
export { useDragReorder } from './hooks/useDragReorder';
export type { DragPosition } from './hooks/useDragReorder';
export { useUndoRedo } from './hooks/useUndoRedo';
