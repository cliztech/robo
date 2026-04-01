/**
 * SGE Gear Component Library — Barrel Export
 * Import all gear units from this single entry point.
 */

// Types
export type {
    GearType, GearSkin, GearSyncState, GearUnitProps, StageSlot, StudioLayout,
} from './gear.types';
export { DEFAULT_SYNC } from './gear.types';

// Gear Units
export { PlatinumCDJ } from './PlatinumCDJ';
export { VintageMixer } from './VintageMixer';
export { CyberTurntable } from './CyberTurntable';
export { FXRack } from './FXRack';
export { SamplerPad } from './SamplerPad';
export { VUMeter } from './VUMeter';
export { WaveformDisplay } from './WaveformDisplay';
export { WaveformHeader } from './WaveformHeader';
export type { DeckTrackInfo } from './WaveformHeader';
export { TrackLibrary } from './TrackLibrary';
export type { TrackItem } from './TrackLibrary';

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

// Hooks — re-export all
export {
    useGearAudio, useLayoutPersistence, useAudioEngineBridge,
    useDragReorder, useUndoRedo, useKeyboardNav, useTouchDrag,
} from './hooks';
export type {
    PersistedGear, PersistedLayout, EngineStatus, DragPosition,
    KeyboardNavOptions, TouchDragOptions,
} from './hooks';
