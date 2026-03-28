/**
 * gear.types.ts — Shared type definitions for SGE Gear Units
 * Implements the mod-drop v1.0 specification.
 */

export type GearType = 'DECK' | 'MIXER' | 'TURNTABLE' | 'FX' | 'SAMPLER';
export type GearSkin = 'PLATINUM' | 'DARK' | 'CYBER' | 'VINTAGE';

export interface GearSyncState {
    bpm: number;
    pitch: number;
    isMaster: boolean;
    phase: number; // 0-1 beat phase
}

export interface GearUnitProps {
    id: string;
    type: GearType;
    label: string;
    skin: GearSkin;
    isDraggable?: boolean;
    syncState?: GearSyncState;
    onPatchChannel?: (targetId: string, channel: number) => void;
}

export interface StageSlot {
    slotId: string;
    column: number;    // 0-11 in a 12-col grid
    columnSpan: number;
    row: number;
    gearId: string | null;
    gearType: GearType | null;
}

export interface StudioLayout {
    id: string;
    name: string;
    slots: StageSlot[];
    createdAt: string;
}

/** Default sync state for new gear units */
export const DEFAULT_SYNC: GearSyncState = {
    bpm: 120.0,
    pitch: 0.0,
    isMaster: false,
    phase: 0,
};
