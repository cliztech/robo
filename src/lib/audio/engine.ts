/**
 * AudioEngine - Core Web Audio API wrapper for broadcast automation.
 * Handles playback, crossfading, EQ, compression, and analysis.
 */

type AudioEngineEventMap = {
  initialized: undefined;
  destroyed: undefined;
  stopped: undefined;
  paused: { at: number };
  resumed: { from: number };
  error: { type: string; trackId?: string; error: unknown };
  'track-loaded': { trackId: string; duration?: number; cached?: boolean };
  'track-started': { track: Track };
  'track-ended': { track: Track | null };
  'crossfade-started': { from: Track; to: Track; duration: number };
  'crossfade-completed': { track: Track | null };
  'volume-changed': { level: number };
  'eq-changed': { band: EQBand; gain: number };
  'metrics-update': AudioMetrics;
};

type AudioEngineEventName = keyof AudioEngineEventMap;
type AudioEngineListener<T extends AudioEngineEventName> = (payload: AudioEngineEventMap[T]) => void;

class TypedEmitter {
  private listeners = new Map<AudioEngineEventName, Set<(payload: unknown) => void>>();

  on<T extends AudioEngineEventName>(event: T, listener: AudioEngineListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener as (payload: unknown) => void);
  }

  off<T extends AudioEngineEventName>(event: T, listener: AudioEngineListener<T>): void {
    this.listeners.get(event)?.delete(listener as (payload: unknown) => void);
  }

  emit<T extends AudioEngineEventName>(event: T, payload: AudioEngineEventMap[T]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  key?: string;
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

export type EQBand = 'low' | 'lowMid' | 'mid' | 'highMid' | 'high';

export class AudioEngine extends TypedEmitter {
  private context: AudioContext | null = null;
  private tracks: Map<string, AudioBuffer> = new Map();

  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private currentTrack: Track | null = null;
  private nextTrack: Track | null = null;

  private masterGain: GainNode | null = null;
  private currentGain: GainNode | null = null;
  private nextGain: GainNode | null = null;

  private eq: Record<EQBand, BiquadFilterNode | null> = {
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
  private animationFrame: number | null = null;

  private config: Required<AudioEngineConfig>;

  private attachSourceHandlers(source: AudioBufferSourceNode, track: Track): void {
    source.onended = () => {
      const isCurrentSource = this.currentSource === source;
      const isCurrentTrack = this.currentTrack === track;

      if (!this.crossfading && isCurrentSource && isCurrentTrack) {
        this.emit('track-ended', { track });
      }
    };
  }

  constructor(config: AudioEngineConfig = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate ?? 48_000,
      latencyHint: config.latencyHint ?? 'interactive',
      autoResume: config.autoResume ?? true,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.context = new AudioContext({
      sampleRate: this.config.sampleRate,
      latencyHint: this.config.latencyHint,
    });

    if (this.context.state === 'suspended' && this.config.autoResume) {
      await this.context.resume();
    }

    this.createAudioGraph();
    this.isInitialized = true;
    this.startMetricsLoop();
    this.emit('initialized', undefined);
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

    this.eq.lowMid = this.context.createBiquadFilter();
    this.eq.lowMid.type = 'peaking';
    this.eq.lowMid.frequency.value = 250;
    this.eq.lowMid.Q.value = 1;

    this.eq.mid = this.context.createBiquadFilter();
    this.eq.mid.type = 'peaking';
    this.eq.mid.frequency.value = 1000;
    this.eq.mid.Q.value = 1;

    this.eq.highMid = this.context.createBiquadFilter();
    this.eq.highMid.type = 'peaking';
    this.eq.highMid.frequency.value = 4000;
    this.eq.highMid.Q.value = 1;

    this.eq.high = this.context.createBiquadFilter();
    this.eq.high.type = 'highshelf';
    this.eq.high.frequency.value = 8000;

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

    this.currentGain.connect(this.eq.low);
    this.nextGain.connect(this.eq.low);
    this.eq.low.connect(this.eq.lowMid);
    this.eq.lowMid.connect(this.eq.mid);
    this.eq.mid.connect(this.eq.highMid);
    this.eq.highMid.connect(this.eq.high);
    this.eq.high.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.masterGain.connect(this.meterAnalyser);
    this.analyser.connect(this.context.destination);
  }

  async loadTrack(track: Track): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized');

    if (this.tracks.has(track.id)) {
      this.emit('track-loaded', { trackId: track.id, cached: true });
      return;
    }

    try {
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
    if (!this.context || !this.currentGain) throw new Error('AudioContext not initialized');

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
    this.currentSource.connect(this.currentGain);
    this.attachSourceHandlers(this.currentSource, track);

    const gainValue = track.gain ?? 1;
    this.currentGain.gain.setValueAtTime(gainValue, this.context.currentTime);

    if ((track.fadeIn ?? 0) > 0) {
      this.currentGain.gain.setValueAtTime(0, this.context.currentTime);
      this.currentGain.gain.linearRampToValueAtTime(gainValue, this.context.currentTime + (track.fadeIn ?? 0));
    }

    const startAt = track.startAt ?? 0;
    const endAt = track.endAt ?? buffer.duration;
    this.currentSource.start(this.context.currentTime, startAt, endAt - startAt);

    this.currentTrack = track;
    this.startTime = this.context.currentTime - startAt;
    this.isPaused = false;

    this.emit('track-started', { track });
  }

  async crossfade(nextTrack: Track, duration = 3): Promise<void> {
    if (!this.context || !this.currentGain || !this.nextGain) throw new Error('AudioContext not initialized');
    if (!this.currentSource || !this.currentTrack) {
      await this.play(nextTrack);
      return;
    }

    if (!this.tracks.has(nextTrack.id)) {
      await this.loadTrack(nextTrack);
    }

    const buffer = this.tracks.get(nextTrack.id);
    if (!buffer) throw new Error('Next track not loaded');

    this.crossfading = true;
    this.nextSource = this.context.createBufferSource();
    this.nextSource.buffer = buffer;
    this.nextSource.connect(this.nextGain);

    const now = this.context.currentTime;
    const end = now + duration;
    const currentGainValue = this.currentTrack.gain ?? 1;
    const nextGainValue = nextTrack.gain ?? 1;

    this.currentGain.gain.setValueAtTime(Math.max(0.001, currentGainValue), now);
    this.currentGain.gain.exponentialRampToValueAtTime(0.001, end);

    this.nextGain.gain.setValueAtTime(0.001, now);
    this.nextGain.gain.exponentialRampToValueAtTime(Math.max(0.001, nextGainValue), end);

    const startAt = nextTrack.startAt ?? 0;
    const endAt = nextTrack.endAt ?? buffer.duration;
    this.nextSource.start(now, startAt, endAt - startAt);

    this.nextTrack = nextTrack;
    this.emit('crossfade-started', { from: this.currentTrack, to: nextTrack, duration });
    window.setTimeout(() => this.completeCrossfade(), duration * 1000);
  }

  private completeCrossfade(): void {
    if (!this.context) return;

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // noop
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    this.currentSource = this.nextSource;
    this.currentTrack = this.nextTrack;

    if (this.currentSource && this.currentTrack) {
      this.attachSourceHandlers(this.currentSource, this.currentTrack);
    }

    this.nextSource = null;
    this.nextTrack = null;

    const oldCurrentGain = this.currentGain;
    this.currentGain = this.nextGain;
    this.nextGain = oldCurrentGain;

    if (this.nextGain) {
      this.nextGain.gain.setValueAtTime(0, this.context.currentTime);
    }

    this.startTime = this.context.currentTime;
    this.crossfading = false;
    this.emit('crossfade-completed', { track: this.currentTrack });
  }

  stop(): void {
    this.stopCurrent();
    this.currentTrack = null;
    this.startTime = 0;
    this.isPaused = false;
    this.emit('stopped', undefined);
  }

  private stopCurrent(): void {
    if (!this.currentSource) return;
    try {
      this.currentSource.stop();
    } catch {
      // noop
    }
    this.currentSource.disconnect();
    this.currentSource = null;
  }

  pause(): void {
    if (!this.context || !this.currentSource || this.isPaused) return;
    this.pauseTime = this.context.currentTime - this.startTime;
    this.stopCurrent();
    this.isPaused = true;
    this.emit('paused', { at: this.pauseTime });
  }

  async resume(): Promise<void> {
    if (!this.context || !this.currentTrack || !this.isPaused || !this.currentGain) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const buffer = this.tracks.get(this.currentTrack.id);
    if (!buffer) throw new Error('Track not loaded');

    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.currentGain);
    this.attachSourceHandlers(this.currentSource, this.currentTrack);

    const remainingDuration = Math.max(0, buffer.duration - this.pauseTime);
    this.currentSource.start(this.context.currentTime, this.pauseTime, remainingDuration);
    this.startTime = this.context.currentTime - this.pauseTime;
    this.isPaused = false;
    this.emit('resumed', { from: this.pauseTime });
  }

  setVolume(level: number): void {
    if (!this.context || !this.masterGain) return;
    const clampedLevel = Math.max(0, Math.min(1, level));
    this.volume = clampedLevel;

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, clampedLevel), now + 0.05);

    this.emit('volume-changed', { level: clampedLevel });
  }

  setEQ(band: EQBand, gain: number): void {
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
    const waveformData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(waveformData);

    this.meterAnalyser.getByteTimeDomainData(this.meterDataArray as unknown as Uint8Array<ArrayBuffer>);

    let peak = 0;
    let sumSquares = 0;
    for (let i = 0; i < this.meterDataArray.length; i += 1) {
      const normalized = (this.meterDataArray[i] - 128) / 128;
      const abs = Math.abs(normalized);
      peak = Math.max(peak, abs);
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / this.meterDataArray.length);
    const currentTime = this.isPaused ? this.pauseTime : this.context.currentTime - this.startTime;
    const duration = this.currentTrack ? (this.tracks.get(this.currentTrack.id)?.duration ?? 0) : 0;

    return {
      currentTime,
      duration,
      remainingTime: Math.max(0, duration - currentTime),
      isPlaying: !this.isPaused && Boolean(this.currentSource),
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
      this.animationFrame = window.requestAnimationFrame(update);
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

    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
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
    this.emit('destroyed', undefined);
    this.removeAllListeners();
  }
}
