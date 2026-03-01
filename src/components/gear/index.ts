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

// Layout Engine
export { StudioStage } from './StudioStage';
