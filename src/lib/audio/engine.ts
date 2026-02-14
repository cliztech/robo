/**
 * AudioEngine - Core Web Audio API wrapper for broadcast automation.
 * Handles playback, crossfading, EQ, compression, and analysis.
 */

import { EventEmitter } from 'events';

export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  startAt?: number;
  endAt?: number;
  gain?: number;
}

export interface AudioEngineConfig {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
  autoResume?: boolean;
}

export interface AudioMetrics {
  currentTime: number;
  duration: number;
  remainingTime: number;
  isPlaying: boolean;
  volume: number;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  peakLevel: number;
  rmsLevel: number;
}

export class AudioEngine extends EventEmitter {
  private context: AudioContext | null = null;
  private tracks: Map<string, AudioBuffer> = new Map();

  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private currentTrack: Track | null = null;
  private nextTrack: Track | null = null;

  private masterGain: GainNode | null = null;
  private currentGain: GainNode | null = null;
  private nextGain: GainNode | null = null;

  private eq: {
    low: BiquadFilterNode | null;
    lowMid: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    highMid: BiquadFilterNode | null;
    high: BiquadFilterNode | null;
  } = {
    low: null,
    lowMid: null,
    mid: null,
    highMid: null,
    high: null,
  };

  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meterAnalyser: AnalyserNode | null = null;
  private meterDataArray: Uint8Array | null = null;

  private isInitialized = false;
  private startTime = 0;
  private pauseTime = 0;
  private isPaused = false;
  private volume = 1;

  private crossfading = false;
  private crossfadeStartTime = 0;

  private animationFrame: number | null = null;

  private config: Required<AudioEngineConfig>;

  constructor(config: AudioEngineConfig = {}) {
    super();

    this.config = {
      sampleRate: config.sampleRate || 48000,
      latencyHint: config.latencyHint || 'interactive',
      autoResume: config.autoResume !== false,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.context = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint,
      });

      if (this.context.state === 'suspended' && this.config.autoResume) {
        await this.context.resume();
      }

      this.createAudioGraph();

      this.isInitialized = true;
      this.emit('initialized');
      this.startMetricsLoop();
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  private createAudioGraph(): void {
    if (!this.context) throw new Error('AudioContext not initialized');

    this.currentGain = this.context.createGain();
    this.nextGain = this.context.createGain();
    this.nextGain.gain.value = 0;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volume;

    this.eq.low = this.context.createBiquadFilter();
    this.eq.low.type = 'lowshelf';
    this.eq.low.frequency.value = 80;
    this.eq.low.gain.value = 0;

    this.eq.lowMid = this.context.createBiquadFilter();
    this.eq.lowMid.type = 'peaking';
    this.eq.lowMid.frequency.value = 250;
    this.eq.lowMid.Q.value = 1;
    this.eq.lowMid.gain.value = 0;

    this.eq.mid = this.context.createBiquadFilter();
    this.eq.mid.type = 'peaking';
    this.eq.mid.frequency.value = 1000;
    this.eq.mid.Q.value = 1;
    this.eq.mid.gain.value = 0;

    this.eq.highMid = this.context.createBiquadFilter();
    this.eq.highMid.type = 'peaking';
    this.eq.highMid.frequency.value = 4000;
    this.eq.highMid.Q.value = 1;
    this.eq.highMid.gain.value = 0;

    this.eq.high = this.context.createBiquadFilter();
    this.eq.high.type = 'highshelf';
    this.eq.high.frequency.value = 8000;
    this.eq.high.gain.value = 0;

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.1;

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.meterAnalyser = this.context.createAnalyser();
    this.meterAnalyser.fftSize = 256;
    this.meterAnalyser.smoothingTimeConstant = 0;
    this.meterDataArray = new Uint8Array(this.meterAnalyser.frequencyBinCount);

    this.currentGain.connect(this.eq.low!);
    this.nextGain.connect(this.eq.low!);
    this.eq.low!.connect(this.eq.lowMid!);
    this.eq.lowMid!.connect(this.eq.mid!);
    this.eq.mid!.connect(this.eq.highMid!);
    this.eq.highMid!.connect(this.eq.high!);
    this.eq.high!.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.masterGain!);
    this.masterGain!.connect(this.analyser);
    this.masterGain!.connect(this.meterAnalyser);
    this.analyser.connect(this.context.destination);
  }

  async loadTrack(track: Track): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized');

    try {
      if (this.tracks.has(track.id)) {
        this.emit('track-loaded', { trackId: track.id, cached: true });
        return;
      }

      const response = await fetch(track.url);
      if (!response.ok) throw new Error(`Failed to fetch track: ${response.statusText}`);

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      this.tracks.set(track.id, audioBuffer);
      this.emit('track-loaded', { trackId: track.id, duration: audioBuffer.duration });
    } catch (error) {
      this.emit('error', { type: 'track-load', trackId: track.id, error });
      throw error;
    }
  }

  async play(track: Track): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized');

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (!this.tracks.has(track.id)) {
      await this.loadTrack(track);
    }

    const buffer = this.tracks.get(track.id);
    if (!buffer) throw new Error('Track not loaded');

    this.stopCurrent();

    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.currentGain!);

    const gainValue = track.gain !== undefined ? track.gain : 1;
    this.currentGain!.gain.setValueAtTime(gainValue, this.context.currentTime);

    const fadeIn = track.fadeIn || 0;
    if (fadeIn > 0) {
      this.currentGain!.gain.setValueAtTime(0, this.context.currentTime);
      this.currentGain!.gain.linearRampToValueAtTime(gainValue, this.context.currentTime + fadeIn);
    }

    const startAt = track.startAt || 0;
    const endAt = track.endAt || buffer.duration;

    this.currentSource.start(this.context.currentTime, startAt, endAt - startAt);

    this.currentTrack = track;
    this.startTime = this.context.currentTime - startAt;
    this.isPaused = false;

    this.currentSource.onended = () => {
      if (!this.crossfading) {
        this.emit('track-ended', { track });
      }
    };

    this.emit('track-started', { track });
  }

  async crossfade(nextTrack: Track, duration = 3): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized');
    if (!this.currentSource || !this.currentTrack) {
      return this.play(nextTrack);
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (!this.tracks.has(nextTrack.id)) {
      await this.loadTrack(nextTrack);
    }

    const buffer = this.tracks.get(nextTrack.id);
    if (!buffer) throw new Error('Next track not loaded');

    this.crossfading = true;
    this.crossfadeStartTime = this.context.currentTime;

    this.nextSource = this.context.createBufferSource();
    this.nextSource.buffer = buffer;
    this.nextSource.connect(this.nextGain!);

    const fadeOutStart = this.context.currentTime;
    const fadeOutEnd = fadeOutStart + duration;
    const fadeInStart = this.context.currentTime;
    const fadeInEnd = fadeInStart + duration;

    const currentGainValue = this.currentTrack.gain !== undefined ? this.currentTrack.gain : 1;
    const nextGainValue = nextTrack.gain !== undefined ? nextTrack.gain : 1;

    this.currentGain!.gain.setValueAtTime(currentGainValue, fadeOutStart);
    this.currentGain!.gain.exponentialRampToValueAtTime(0.001, fadeOutEnd);

    this.nextGain!.gain.setValueAtTime(0.001, fadeInStart);
    this.nextGain!.gain.exponentialRampToValueAtTime(nextGainValue, fadeInEnd);

    const startAt = nextTrack.startAt || 0;
    const endAt = nextTrack.endAt || buffer.duration;
    this.nextSource.start(this.context.currentTime, startAt, endAt - startAt);

    this.nextTrack = nextTrack;
    this.emit('crossfade-started', { from: this.currentTrack, to: nextTrack, duration });

    setTimeout(() => {
      this.completeCrossfade();
    }, duration * 1000);
  }

  private completeCrossfade(): void {
    if (!this.context) return;

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    this.currentSource = this.nextSource;
    this.currentTrack = this.nextTrack;
    this.nextSource = null;
    this.nextTrack = null;

    const swapGain = this.currentGain;
    this.currentGain = this.nextGain;
    this.nextGain = swapGain;

    if (this.nextGain) {
      this.nextGain.gain.setValueAtTime(0, this.context.currentTime);
    }

    this.startTime = this.context.currentTime;
    this.crossfading = false;
    this.emit('crossfade-completed', { track: this.currentTrack });

    if (this.currentSource) {
      this.currentSource.onended = () => {
        if (!this.crossfading) {
          this.emit('track-ended', { track: this.currentTrack });
        }
      };
    }
  }

  stop(): void {
    this.stopCurrent();
    this.currentTrack = null;
    this.startTime = 0;
    this.isPaused = false;
    this.emit('stopped');
  }

  private stopCurrent(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // noop
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }
  }

  pause(): void {
    if (!this.context || !this.currentSource || this.isPaused) return;

    this.pauseTime = this.context.currentTime - this.startTime;
    this.stopCurrent();
    this.isPaused = true;
    this.emit('paused', { at: this.pauseTime });
  }

  async resume(): Promise<void> {
    if (!this.context || !this.currentTrack || !this.isPaused) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const buffer = this.tracks.get(this.currentTrack.id);
    if (!buffer) throw new Error('Track not loaded');

    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.currentGain!);

    const remainingDuration = buffer.duration - this.pauseTime;
    this.currentSource.start(this.context.currentTime, this.pauseTime, remainingDuration);

    this.startTime = this.context.currentTime - this.pauseTime;
    this.isPaused = false;

    this.currentSource.onended = () => {
      if (!this.crossfading) {
        this.emit('track-ended', { track: this.currentTrack });
      }
    };

    this.emit('resumed', { from: this.pauseTime });
  }

  setVolume(level: number): void {
    if (!this.context || !this.masterGain) return;

    const clampedLevel = Math.max(0, Math.min(1, level));
    this.volume = clampedLevel;

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, clampedLevel), now + 0.05);

    this.emit('volume-changed', { level: clampedLevel });
  }

  setEQ(band: 'low' | 'lowMid' | 'mid' | 'highMid' | 'high', gain: number): void {
    if (!this.context) return;

    const filter = this.eq[band];
    if (!filter) return;

    const clampedGain = Math.max(-12, Math.min(12, gain));
    const now = this.context.currentTime;

    filter.gain.cancelScheduledValues(now);
    filter.gain.setValueAtTime(filter.gain.value, now);
    filter.gain.linearRampToValueAtTime(clampedGain, now + 0.05);

    this.emit('eq-changed', { band, gain: clampedGain });
  }

  getMetrics(): AudioMetrics {
    if (!this.context || !this.analyser || !this.meterAnalyser || !this.meterDataArray) {
      return {
        currentTime: 0,
        duration: 0,
        remainingTime: 0,
        isPlaying: false,
        volume: this.volume,
        frequencyData: new Uint8Array(0),
        waveformData: new Uint8Array(0),
        peakLevel: 0,
        rmsLevel: 0,
      };
    }

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);

    const waveformData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(waveformData);

    this.meterAnalyser.getByteTimeDomainData(this.meterDataArray);

    let peak = 0;
    let sumSquares = 0;
    for (let i = 0; i < this.meterDataArray.length; i += 1) {
      const normalized = (this.meterDataArray[i] - 128) / 128;
      const abs = Math.abs(normalized);
      if (abs > peak) peak = abs;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / this.meterDataArray.length);

    const currentTime = this.isPaused ? this.pauseTime : this.context.currentTime - this.startTime;

    const duration = this.currentTrack ? (this.tracks.get(this.currentTrack.id)?.duration || 0) : 0;

    const remainingTime = Math.max(0, duration - currentTime);

    return {
      currentTime,
      duration,
      remainingTime,
      isPlaying: !this.isPaused && !!this.currentSource,
      volume: this.volume,
      frequencyData,
      waveformData,
      peakLevel: peak,
      rmsLevel: rms,
    };
  }

  private startMetricsLoop(): void {
    const update = () => {
      this.emit('metrics-update', this.getMetrics());
      this.animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getNextTrack(): Track | null {
    return this.nextTrack;
  }

  isCrossfading(): boolean {
    return this.crossfading;
  }

  async destroy(): Promise<void> {
    this.stop();

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.currentGain?.disconnect();
    this.nextGain?.disconnect();
    this.masterGain?.disconnect();
    this.eq.low?.disconnect();
    this.eq.lowMid?.disconnect();
    this.eq.mid?.disconnect();
    this.eq.highMid?.disconnect();
    this.eq.high?.disconnect();
    this.compressor?.disconnect();
    this.limiter?.disconnect();
    this.analyser?.disconnect();
    this.meterAnalyser?.disconnect();

    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }

    this.context = null;
    this.tracks.clear();
    this.isInitialized = false;

    this.emit('destroyed');
    this.removeAllListeners();
  }
}
