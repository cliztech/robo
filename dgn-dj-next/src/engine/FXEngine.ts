// ═══════════════════════════════════════════════════════════════
//  DGN-DJ STUDIO — FX Engine
//  Audio effect chain: Echo, Reverb, Flanger, Roll, Phaser
//  Each deck has 4 independent FX slots.
// ═══════════════════════════════════════════════════════════════

import type { DeckId } from '../types';
import { audioEngine } from './AudioEngine';

interface FXSlotNode {
    inputGain: GainNode;
    wetGain: GainNode;
    dryGain: GainNode;
    outputGain: GainNode;
    effectNodes: AudioNode[];
    active: boolean;
    wet: number;
    type: string;
}

class FXEngine {
    private slots: Map<string, FXSlotNode> = new Map();

    private key(deck: DeckId, slot: number): string {
        return `${deck}-${slot}`;
    }

    /** Initialize an FX slot — call after AudioEngine.init() */
    initSlot(deck: DeckId, slotIndex: number, effectType: string): void {
        const ctx = audioEngine.audioContext;
        if (!ctx) return;

        const k = this.key(deck, slotIndex);

        // Clean up existing
        this.destroySlot(deck, slotIndex);

        const inputGain = ctx.createGain();
        const wetGain = ctx.createGain();
        const dryGain = ctx.createGain();
        const outputGain = ctx.createGain();

        wetGain.gain.value = 0; // Start inactive
        dryGain.gain.value = 1;

        // Dry path
        inputGain.connect(dryGain);
        dryGain.connect(outputGain);

        // Wet path — effect-specific
        const effectNodes = this.createEffectChain(ctx, effectType, inputGain, wetGain);

        wetGain.connect(outputGain);

        this.slots.set(k, {
            inputGain,
            wetGain,
            dryGain,
            outputGain,
            effectNodes,
            active: false,
            wet: 0.5,
            type: effectType,
        });
    }

    private createEffectChain(
        ctx: AudioContext,
        type: string,
        input: GainNode,
        output: GainNode
    ): AudioNode[] {
        const nodes: AudioNode[] = [];

        switch (type.toUpperCase()) {
            case 'ECHO': {
                const delay = ctx.createDelay(2);
                delay.delayTime.value = 0.375; // 3/8 beat at 120bpm
                const feedback = ctx.createGain();
                feedback.gain.value = 0.4;

                input.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay); // Feedback loop
                delay.connect(output);

                nodes.push(delay, feedback);
                break;
            }
            case 'REVERB': {
                // Fake reverb using parallel delays
                const delays = [0.03, 0.07, 0.11, 0.15];
                const gains = [0.7, 0.5, 0.3, 0.2];

                for (let i = 0; i < delays.length; i++) {
                    const d = ctx.createDelay();
                    d.delayTime.value = delays[i];
                    const g = ctx.createGain();
                    g.gain.value = gains[i];

                    input.connect(d);
                    d.connect(g);
                    g.connect(output);
                    nodes.push(d, g);
                }
                break;
            }
            case 'FLANGER': {
                const delay = ctx.createDelay();
                delay.delayTime.value = 0.005;
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.5;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 0.003;

                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                lfo.start();

                input.connect(delay);
                delay.connect(output);

                nodes.push(delay, lfo, lfoGain);
                break;
            }
            case 'ROLL': {
                // Beat repeat effect using short delay with high feedback
                const delay = ctx.createDelay(2);
                delay.delayTime.value = 0.125; // 1/8 beat
                const feedback = ctx.createGain();
                feedback.gain.value = 0.85;

                input.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(output);

                nodes.push(delay, feedback);
                break;
            }
            case 'PHASER': {
                // Allpass filter chain with LFO
                let lastNode: AudioNode = input;
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.3;
                lfo.start();

                for (let i = 0; i < 4; i++) {
                    const allpass = ctx.createBiquadFilter();
                    allpass.type = 'allpass';
                    allpass.frequency.value = 1000 + i * 500;

                    const lfoGain = ctx.createGain();
                    lfoGain.gain.value = 500;
                    lfo.connect(lfoGain);
                    lfoGain.connect(allpass.frequency);

                    lastNode.connect(allpass);
                    lastNode = allpass;
                    nodes.push(allpass, lfoGain);
                }

                lastNode.connect(output);
                nodes.push(lfo);
                break;
            }
            case 'SWEEP': {
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 5;

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.2;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 2000;
                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
                lfo.start();

                input.connect(filter);
                filter.connect(output);
                nodes.push(filter, lfo, lfoGain);
                break;
            }
            case 'V.BRAKE': {
                // Vinyl brake simulation — not a real-time insert effect
                // Just pass through
                input.connect(output);
                break;
            }
            case 'PITCH': {
                // Pitch shift — pass through (handled by playbackRate)
                input.connect(output);
                break;
            }
            default: {
                input.connect(output);
                break;
            }
        }

        return nodes;
    }

    /** Toggle FX slot on/off */
    toggleFX(deck: DeckId, slotIndex: number, active: boolean): void {
        const slot = this.slots.get(this.key(deck, slotIndex));
        if (!slot) return;

        slot.active = active;
        slot.wetGain.gain.value = active ? slot.wet : 0;
        slot.dryGain.gain.value = active ? (1 - slot.wet * 0.5) : 1;
    }

    /** Set wet/dry mix (0-1) */
    setWet(deck: DeckId, slotIndex: number, wet: number): void {
        const slot = this.slots.get(this.key(deck, slotIndex));
        if (!slot) return;

        slot.wet = wet;
        if (slot.active) {
            slot.wetGain.gain.value = wet;
            slot.dryGain.gain.value = 1 - wet * 0.5;
        }
    }

    /** Set beat division for time-based effects */
    setBeatDiv(deck: DeckId, slotIndex: number, beatDiv: string, bpm = 120): void {
        const slot = this.slots.get(this.key(deck, slotIndex));
        if (!slot) return;

        // Convert beat division to time in seconds
        const beatSec = 60 / bpm;
        const divMap: Record<string, number> = {
            '1/4': 0.25,
            '1/2': 0.5,
            '1': 1,
            '2': 2,
            '4': 4,
        };
        const multiplier = divMap[beatDiv] ?? 1;
        const delayTime = beatSec * multiplier;

        // Find the delay node and update its time
        for (const node of slot.effectNodes) {
            if (node instanceof DelayNode) {
                node.delayTime.value = Math.min(delayTime, 2);
                break;
            }
        }
    }

    /** Change the effect type for a slot */
    changeEffect(deck: DeckId, slotIndex: number, newType: string): void {
        const slot = this.slots.get(this.key(deck, slotIndex));
        const wasActive = slot?.active ?? false;
        const wet = slot?.wet ?? 0.5;

        this.initSlot(deck, slotIndex, newType);

        if (wasActive) {
            this.setWet(deck, slotIndex, wet);
            this.toggleFX(deck, slotIndex, true);
        }
    }

    /** Destroy a slot's nodes */
    private destroySlot(deck: DeckId, slotIndex: number): void {
        const slot = this.slots.get(this.key(deck, slotIndex));
        if (!slot) return;

        for (const node of slot.effectNodes) {
            try {
                if ('stop' in node && typeof node.stop === 'function') {
                    (node as OscillatorNode).stop();
                }
                node.disconnect();
            } catch { /* noop */ }
        }
        slot.inputGain.disconnect();
        slot.wetGain.disconnect();
        slot.dryGain.disconnect();
        slot.outputGain.disconnect();

        this.slots.delete(this.key(deck, slotIndex));
    }

    /** Clean up all slots */
    destroy(): void {
        for (const [key] of this.slots) {
            const [deck, slot] = key.split('-');
            this.destroySlot(deck as DeckId, parseInt(slot));
        }
    }
}

// Singleton export
export const fxEngine = new FXEngine();
