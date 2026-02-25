'use client';

import { Disc3, Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react';
import { DegenEffectRack } from '@/components/audio/DegenEffectRack';
import { DegenMixer } from '@/components/audio/DegenMixer';
import { DegenTrackList } from '@/components/audio/DegenTrackList';
import { DegenWaveform } from '@/components/audio/DegenWaveform';
import { cn } from '@/lib/utils';

interface DeckTransportClusterProps {
    deck: 'A' | 'B';
    isPlaying: boolean;
}

function DeckTransportCluster({ deck, isPlaying }: DeckTransportClusterProps) {
    const isDeckA = deck === 'A';

    return (
        <section className="glass-panel overflow-hidden">
            <div className="panel-header">
                <span className="panel-header-title">Deck {deck} Transport</span>
                <span className={cn('dj-deck-badge', isDeckA ? 'dj-deck-a-tone' : 'dj-deck-b-tone')}>
                    {isDeckA ? 'Live' : 'Standby'}
                </span>
            </div>
            <div className="dj-deck-cluster" data-deck={deck}>
                <div className="dj-jog-wheel" data-deck={deck} aria-hidden>
                    <Disc3 size={32} />
                </div>
                <div className="dj-transport-buttons" role="group" aria-label={`Deck ${deck} transport`}>
                    <button type="button" aria-label={`Deck ${deck} cue`}>
                        <Square size={13} />
                    </button>
                    <button type="button" aria-label={`Deck ${deck} previous`}>
                        <SkipBack size={13} />
                    </button>
                    <button type="button" className="is-primary" aria-label={`Deck ${deck} play pause`}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                    <button type="button" aria-label={`Deck ${deck} next`}>
                        <SkipForward size={13} />
                    </button>
                </div>
            </div>
        </section>
    );
}

function PerformancePadGrid() {
    return (
        <section className="glass-panel overflow-hidden">
            <div className="panel-header">
                <span className="panel-header-title">Performance Pads</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-[0.16em]">Bank B</span>
            </div>
            <div className="dj-performance-pad-grid">
                {Array.from({ length: 16 }, (_, index) => (
                    <button
                        key={index}
                        type="button"
                        className="dj-performance-pad"
                        aria-label={`Performance pad ${index + 1}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </section>
    );
}

export function DJStudioSurface() {
    return (
        <div className="dj-studio-surface">
            <section className="glass-panel overflow-hidden dj-area-wave-a">
                <div className="panel-header">
                    <span className="panel-header-title">Waveform Rail A</span>
                </div>
                <div className="p-3">
                    <DegenWaveform
                        deck="A"
                        progress={0.42}
                        duration={234}
                        trackTitle="Neural Drift v2.1 — SynthKong"
                        isPlaying
                        cuePoints={[
                            { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                            { position: 0.68, label: 'DROP', color: '#bf00ff' },
                        ]}
                    />
                </div>
            </section>

            <section className="glass-panel overflow-hidden dj-area-wave-b">
                <div className="panel-header">
                    <span className="panel-header-title">Waveform Rail B</span>
                </div>
                <div className="p-3">
                    <DegenWaveform
                        deck="B"
                        progress={0.15}
                        duration={198}
                        trackTitle="Bass Gorilla — DJ DegenApe"
                        isPlaying={false}
                        cuePoints={[
                            { position: 0.08, label: 'INTRO', color: '#3b82f6' },
                            { position: 0.52, label: 'BUILD', color: '#bf00ff' },
                        ]}
                    />
                </div>
            </section>

            <div className="dj-area-deck-a"><DeckTransportCluster deck="A" isPlaying /></div>

            <section className="glass-panel overflow-hidden dj-area-mixer">
                <div className="panel-header">
                    <span className="panel-header-title">Mixer + Crossfader</span>
                </div>
                <div className="p-2 lg:p-3">
                    <DegenMixer className="dj-studio-mixer" />
                </div>
            </section>

            <div className="dj-area-deck-b"><DeckTransportCluster deck="B" isPlaying={false} /></div>

            <section className="glass-panel overflow-hidden dj-area-library">
                <div className="panel-header">
                    <span className="panel-header-title">Browser / Library</span>
                </div>
                <div className="p-3">
                    <DegenTrackList className="dj-studio-library" />
                </div>
            </section>

            <section className="dj-performance-stack dj-area-performance">
                <PerformancePadGrid />
                <DegenEffectRack
                    title="FX Bank B"
                    deck="B"
                    isActive={false}
                    controls={[
                        { key: 'chorus', label: 'Chorus', unit: '%' },
                        { key: 'phaser', label: 'Phaser', unit: '%' },
                        { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                        { key: 'flanger', label: 'Flanger', unit: '%' },
                        { key: 'bitcrush', label: 'Crush', unit: 'bit', max: 16 },
                    ]}
                />
            </section>
        </div>
    );
}
