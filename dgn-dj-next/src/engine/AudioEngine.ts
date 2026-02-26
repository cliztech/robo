// ═══════════════════════════════════════════════════════════════
//  DGN-DJ STUDIO — Web Audio Engine
//  Handles audio decoding, playback, EQ, filter, crossfader,
//  waveform analysis, and VU metering for 4 decks.
// ═══════════════════════════════════════════════════════════════

import type { DeckId } from '../types';

/** Per-deck audio channel: source → EQ → filter → gain → crossfader/master */
interface DeckChannel {
    source: AudioBufferSourceNode | null;
    buffer: AudioBuffer | null;
    gainNode: GainNode;
    eqHi: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqLo: BiquadFilterNode;
    filter: BiquadFilterNode;
    analyser: AnalyserNode;
    trimNode: GainNode;
    startedAt: number;     // AudioContext.currentTime when playback started
    pausedAt: number;      // Offset in seconds when paused
    playing: boolean;
    playbackRate: number;
    loopStart: number | null;
    loopEnd: number | null;
}

/** Waveform peak data extracted from an AudioBuffer */
export interface WaveformPeaks {
    peaks: Float32Array;
    duration: number;
}

class AudioEngine {
    private ctx: AudioContext | null = null;
    private channels: Map<DeckId, DeckChannel> = new Map();
    private masterGain: GainNode | null = null;
    private crossfaderValue = 0.5; // 0=A, 0.5=center, 1=B
    private crossfaderGains: { A: GainNode | null; B: GainNode | null } = { A: null, B: null };

    // Position update callback
    private positionCallbacks: Map<DeckId, (position: number) => void> = new Map();
    private animationFrameId: number | null = null;

    /** Initialize the AudioContext (must be called from a user gesture) */
    async init(): Promise<void> {
        if (this.ctx) return;

        this.ctx = new AudioContext({ sampleRate: 44100 });

        // Master output chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);

        // Crossfader gains for A and B
        this.crossfaderGains.A = this.ctx.createGain();
        this.crossfaderGains.B = this.ctx.createGain();
        this.crossfaderGains.A.connect(this.masterGain);
        this.crossfaderGains.B.connect(this.masterGain);
        this.applyCrossfader();

        // Initialize 4 deck channels
        const decks: DeckId[] = ['A', 'B', 'C', 'D'];
        for (const id of decks) {
            this.createChannel(id);
        }

        // Start position tracking loop
        this.startPositionTracking();
    }

    /** Create an audio channel for a deck */
    private createChannel(id: DeckId): void {
        if (!this.ctx) return;

        const gainNode = this.ctx.createGain();
        const trimNode = this.ctx.createGain();
        const eqHi = this.ctx.createBiquadFilter();
        const eqMid = this.ctx.createBiquadFilter();
        const eqLo = this.ctx.createBiquadFilter();
        const filter = this.ctx.createBiquadFilter();
        const analyser = this.ctx.createAnalyser();

        // EQ configuration
        eqHi.type = 'highshelf';
        eqHi.frequency.value = 3200;
        eqHi.gain.value = 0;

        eqMid.type = 'peaking';
        eqMid.frequency.value = 1000;
        eqMid.Q.value = 0.7;
        eqMid.gain.value = 0;

        eqLo.type = 'lowshelf';
        eqLo.frequency.value = 320;
        eqLo.gain.value = 0;

        // Filter: sweepable low/high pass
        filter.type = 'lowpass';
        filter.frequency.value = 20000; // Fully open
        filter.Q.value = 1;

        // Analyser for VU/waveform
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        // Chain: trim → EQ(lo→mid→hi) → filter → analyser → gain → crossfader/master
        trimNode.connect(eqLo);
        eqLo.connect(eqMid);
        eqMid.connect(eqHi);
        eqHi.connect(filter);
        filter.connect(analyser);
        analyser.connect(gainNode);

        // Route A/B through crossfader, C/D direct to master
        const dest = (id === 'A') ? this.crossfaderGains.A!
            : (id === 'B') ? this.crossfaderGains.B!
                : this.masterGain!;
        gainNode.connect(dest);

        this.channels.set(id, {
            source: null,
            buffer: null,
            gainNode,
            eqHi,
            eqMid,
            eqLo,
            filter,
            analyser,
            trimNode,
            startedAt: 0,
            pausedAt: 0,
            playing: false,
            playbackRate: 1.0,
            loopStart: null,
            loopEnd: null,
        });
    }

    /** Decode an audio file into an AudioBuffer */
    async decodeFile(file: File): Promise<AudioBuffer> {
        if (!this.ctx) throw new Error('AudioEngine not initialized');
        const arrayBuffer = await file.arrayBuffer();
        return this.ctx.decodeAudioData(arrayBuffer);
    }

    /** Generate a demo tone buffer at a given BPM */
    generateDemoBuffer(bpm: number, durationSec = 30): AudioBuffer {
        if (!this.ctx) throw new Error('AudioEngine not initialized');

        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * durationSec;
        const buffer = this.ctx.createBuffer(2, length, sampleRate);

        const beatInterval = 60 / bpm;
        const clickDuration = 0.02; // 20ms click

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const beatPos = t % beatInterval;

                // Kick-like sound on each beat
                if (beatPos < clickDuration) {
                    const env = 1 - (beatPos / clickDuration);
                    const freq = 80 + (200 * env); // Pitch sweep down
                    data[i] = Math.sin(2 * Math.PI * freq * beatPos) * env * 0.6;
                }
                // Sub-bass tone
                else {
                    data[i] = Math.sin(2 * Math.PI * 55 * t) * 0.05;
                }

                // Stereo width
                if (ch === 1) {
                    data[i] *= 0.95;
                }
            }
        }

        return buffer;
    }

    /** Load an AudioBuffer onto a deck */
    loadBuffer(deckId: DeckId, buffer: AudioBuffer): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        // Stop current playback
        if (ch.playing && ch.source) {
            ch.source.stop();
            ch.source.disconnect();
        }

        ch.buffer = buffer;
        ch.pausedAt = 0;
        ch.playing = false;
        ch.source = null;
    }

    /** Extract waveform peaks from a buffer */
    extractPeaks(buffer: AudioBuffer, numPeaks = 800): WaveformPeaks {
        const ch0 = buffer.getChannelData(0);
        const samplesPerPeak = Math.floor(ch0.length / numPeaks);
        const peaks = new Float32Array(numPeaks);

        for (let i = 0; i < numPeaks; i++) {
            let max = 0;
            const start = i * samplesPerPeak;
            const end = Math.min(start + samplesPerPeak, ch0.length);
            for (let j = start; j < end; j++) {
                const abs = Math.abs(ch0[j]);
                if (abs > max) max = abs;
            }
            peaks[i] = max;
        }

        return { peaks, duration: buffer.duration };
    }

    /** Play a deck from its current position */
    play(deckId: DeckId): void {
        const ch = this.channels.get(deckId);
        if (!ch || !ch.buffer || !this.ctx) return;

        // Stop existing source
        if (ch.source) {
            try { ch.source.stop(); } catch { /* already stopped */ }
            ch.source.disconnect();
        }

        // Create new source
        const source = this.ctx.createBufferSource();
        source.buffer = ch.buffer;
        source.playbackRate.value = ch.playbackRate;
        source.connect(ch.trimNode);

        // Loop
        if (ch.loopStart !== null && ch.loopEnd !== null) {
            source.loop = true;
            source.loopStart = ch.loopStart;
            source.loopEnd = ch.loopEnd;
        }

        // Handle end of track
        source.onended = () => {
            if (ch.playing && !source.loop) {
                ch.playing = false;
                ch.pausedAt = 0;
            }
        };

        const offset = ch.pausedAt;
        source.start(0, offset);

        ch.source = source;
        ch.startedAt = this.ctx.currentTime - offset;
        ch.playing = true;
    }

    /** Pause a deck */
    pause(deckId: DeckId): void {
        const ch = this.channels.get(deckId);
        if (!ch || !ch.playing || !this.ctx) return;

        ch.pausedAt = this.getPosition(deckId);
        ch.playing = false;

        if (ch.source) {
            try { ch.source.stop(); } catch { /* noop */ }
            ch.source.disconnect();
            ch.source = null;
        }
    }

    /** Get current playback position in seconds */
    getPosition(deckId: DeckId): number {
        const ch = this.channels.get(deckId);
        if (!ch || !this.ctx) return 0;

        if (!ch.playing) return ch.pausedAt;

        const elapsed = (this.ctx.currentTime - ch.startedAt) * ch.playbackRate;

        if (ch.buffer) {
            // Handle loop
            if (ch.loopStart !== null && ch.loopEnd !== null && ch.loopEnd > ch.loopStart) {
                const loopLen = ch.loopEnd - ch.loopStart;
                if (elapsed >= ch.loopStart) {
                    return ch.loopStart + ((elapsed - ch.loopStart) % loopLen);
                }
            }
            return Math.min(elapsed, ch.buffer.duration);
        }

        return elapsed;
    }

    /** Seek to a position in seconds */
    seek(deckId: DeckId, position: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        const wasPlaying = ch.playing;
        if (wasPlaying) this.pause(deckId);

        ch.pausedAt = Math.max(0, position);
        if (wasPlaying) this.play(deckId);
    }

    /** Set playback rate (pitch) — pitch is in percentage, e.g. -2.0 = -2% */
    setPitch(deckId: DeckId, pitchPercent: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        ch.playbackRate = 1 + (pitchPercent / 100);
        if (ch.source) {
            ch.source.playbackRate.value = ch.playbackRate;
        }
    }

    /** Set channel volume (0-100) */
    setVolume(deckId: DeckId, volume: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;
        ch.gainNode.gain.value = volume / 100;
    }

    /** Set trim gain (0-100, center=50) */
    setTrim(deckId: DeckId, trim: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;
        // Map 0-100 to 0-2 (50 = unity gain)
        ch.trimNode.gain.value = trim / 50;
    }

    /** Set 3-band EQ (each 0-100, center=50 = no boost/cut) */
    setEQ(deckId: DeckId, band: 'hi' | 'mid' | 'lo', value: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        // Map 0-100 to -24dB to +12dB (50 = 0dB)
        const db = ((value - 50) / 50) * (value > 50 ? 12 : 24);

        const filterNode = band === 'hi' ? ch.eqHi
            : band === 'mid' ? ch.eqMid
                : ch.eqLo;
        filterNode.gain.value = db;
    }

    /** Set filter sweep (0-100: 0=LP closed, 50=open, 100=HP closed) */
    setFilter(deckId: DeckId, value: number): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        if (value <= 50) {
            // Low-pass: 50 = 20kHz (open), 0 = 100Hz (closed)
            ch.filter.type = 'lowpass';
            const freq = 100 * Math.pow(200, value / 50); // Exponential sweep
            ch.filter.frequency.value = freq;
        } else {
            // High-pass: 50 = 20Hz (open), 100 = 5kHz (closed)
            ch.filter.type = 'highpass';
            const normalized = (value - 50) / 50;
            const freq = 20 * Math.pow(250, normalized);
            ch.filter.frequency.value = freq;
        }
    }

    /** Set crossfader position (0-100: 0=A, 50=center, 100=B) */
    setCrossfader(value: number): void {
        this.crossfaderValue = value / 100;
        this.applyCrossfader();
    }

    private applyCrossfader(): void {
        if (!this.crossfaderGains.A || !this.crossfaderGains.B) return;

        // Equal-power crossfade curve
        const angle = this.crossfaderValue * Math.PI / 2;
        this.crossfaderGains.A.gain.value = Math.cos(angle);
        this.crossfaderGains.B.gain.value = Math.sin(angle);
    }

    /** Set loop points */
    setLoop(deckId: DeckId, loopStart: number | null, loopEnd: number | null): void {
        const ch = this.channels.get(deckId);
        if (!ch) return;

        ch.loopStart = loopStart;
        ch.loopEnd = loopEnd;

        // If currently playing, restart with new loop points
        if (ch.playing) {
            const pos = this.getPosition(deckId);
            this.pause(deckId);
            ch.pausedAt = pos;
            this.play(deckId);
        }
    }

    /** Nudge pitch temporarily (jog wheel) */
    nudge(deckId: DeckId, delta: number): void {
        const ch = this.channels.get(deckId);
        if (!ch || !ch.source) return;

        // Temporary pitch bend
        const nudgedRate = ch.playbackRate + delta;
        ch.source.playbackRate.value = Math.max(0.5, Math.min(2.0, nudgedRate));
    }

    /** Stop nudge — return to base playback rate */
    stopNudge(deckId: DeckId): void {
        const ch = this.channels.get(deckId);
        if (!ch || !ch.source) return;
        ch.source.playbackRate.value = ch.playbackRate;
    }

    /** Get RMS level for VU metering (0-1) */
    getLevel(deckId: DeckId): number {
        const ch = this.channels.get(deckId);
        if (!ch || !ch.playing) return 0;

        const dataArray = new Float32Array(ch.analyser.fftSize);
        ch.analyser.getFloatTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Scale to 0-1 range with headroom
        return Math.min(1, rms * 3);
    }

    /** Get frequency data for waveform visualization */
    getFrequencyData(deckId: DeckId): Uint8Array | null {
        const ch = this.channels.get(deckId);
        if (!ch) return null;

        const data = new Uint8Array(ch.analyser.frequencyBinCount);
        ch.analyser.getByteFrequencyData(data);
        return data;
    }

    /** Register a position update callback */
    onPositionUpdate(deckId: DeckId, callback: (position: number) => void): void {
        this.positionCallbacks.set(deckId, callback);
    }

    /** Remove position callback */
    removePositionUpdate(deckId: DeckId): void {
        this.positionCallbacks.delete(deckId);
    }

    /** Position tracking animation loop */
    private startPositionTracking(): void {
        const tick = () => {
            this.positionCallbacks.forEach((callback, deckId) => {
                const ch = this.channels.get(deckId);
                if (ch?.playing) {
                    callback(this.getPosition(deckId));
                }
            });
            this.animationFrameId = requestAnimationFrame(tick);
        };
        this.animationFrameId = requestAnimationFrame(tick);
    }

    /** Check if a deck has a buffer loaded */
    hasBuffer(deckId: DeckId): boolean {
        const ch = this.channels.get(deckId);
        return Boolean(ch?.buffer);
    }

    /** Get buffer duration */
    getBufferDuration(deckId: DeckId): number {
        const ch = this.channels.get(deckId);
        return ch?.buffer?.duration ?? 0;
    }

    /** Check if engine is initialized */
    get isReady(): boolean {
        return this.ctx !== null;
    }

    /** Get the underlying AudioContext */
    get audioContext(): AudioContext | null {
        return this.ctx;
    }

    /** Clean up */
    destroy(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.channels.forEach((ch) => {
            if (ch.source) {
                try { ch.source.stop(); } catch { /* noop */ }
            }
        });
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
    }
}

// Singleton export
export const audioEngine = new AudioEngine();
