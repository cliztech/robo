import { AudioAnalyzer } from './analyzer';
import type { AudioMetrics, Track } from './engine';

export interface StudioTelemetrySnapshot {
  waveformPosition: number;
  durationSeconds: number;
  waveformData: number[];
}

export interface TransportTelemetry {
  progress: number;
  elapsedSeconds: number;
  durationSeconds: number;
  remainingSeconds: number;
  isPlaying: boolean;
}

export interface StereoLevelTelemetry {
  leftLevel: number;
  rightLevel: number;
  leftPeak: number;
  rightPeak: number;
}

export interface MixerChannelTelemetry {
  id: string;
  level: number;
  peak: number;
}

export interface MixerTelemetry {
  channels: MixerChannelTelemetry[];
  master: StereoLevelTelemetry;
}

export interface SignalFlagsTelemetry {
  clipDetected: boolean;
  limiterEngaged: boolean;
}

export interface DJTelemetry {
  transport: TransportTelemetry;
  stereoLevels: StereoLevelTelemetry;
  waveformPeaks: number[];
  mixer: MixerTelemetry;
  signalFlags: SignalFlagsTelemetry;
}

const DEFAULT_WAVEFORM_SAMPLE_SIZE = 250;
const DETERMINISTIC_WAVEFORM_SEED = 1337;
const LIMITER_THRESHOLD = 0.9;

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function downsampleWaveform(waveformData: Uint8Array, sampleSize = DEFAULT_WAVEFORM_SAMPLE_SIZE): number[] {
  if (!waveformData.length || sampleSize <= 0) {
    return deterministicWaveformSample(sampleSize);
  }

  const windowSize = Math.max(1, Math.floor(waveformData.length / sampleSize));
  const peaks: number[] = [];

  for (let offset = 0; offset < waveformData.length; offset += windowSize) {
    let peak = 0;
    const end = Math.min(waveformData.length, offset + windowSize);

    for (let i = offset; i < end; i += 1) {
      const normalized = Math.abs((waveformData[i] - 128) / 128);
      peak = Math.max(peak, normalized);
    }

    peaks.push(clampUnit(peak));
  }

  while (peaks.length < sampleSize) {
    peaks.push(peaks[peaks.length - 1] ?? 0);
  }

  return peaks.slice(0, sampleSize);
}

export function deterministicWaveformSample(length = DEFAULT_WAVEFORM_SAMPLE_SIZE, seed = DETERMINISTIC_WAVEFORM_SEED): number[] {
  const sampleLength = Math.max(1, Math.floor(length));
  const data: number[] = [];
  let state = seed;

  for (let i = 0; i < sampleLength; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const noise = state / 0xffffffff;
    const t = i / sampleLength;
    const envelope = Math.sin(t * Math.PI) * 0.35;
    const harmonic = Math.sin(t * Math.PI * 6.4) * 0.08 + Math.cos(t * Math.PI * 2.3) * 0.05;
    data.push(clampUnit(0.12 + envelope + harmonic + noise * 0.1));
  }

  return data;
}

export function createDJTelemetry(metrics: AudioMetrics | null, currentTrack: Track | null): DJTelemetry {
  const durationSeconds = metrics?.duration || currentTrack?.duration || 0;
  const elapsedSeconds = metrics?.currentTime || 0;
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
  const progress = durationSeconds > 0 ? clampUnit(elapsedSeconds / durationSeconds) : 0;

  const waveformPeaks = metrics ? downsampleWaveform(metrics.waveformData) : deterministicWaveformSample();
  const leftLevel = clampUnit(metrics?.rmsLevel ?? 0);
  const rightLevel = clampUnit(metrics?.rmsLevel ?? 0);
  const leftPeak = clampUnit(metrics?.peakLevel ?? 0);
  const rightPeak = clampUnit(metrics?.peakLevel ?? 0);

  const clipDetected = metrics?.waveformData ? AudioAnalyzer.detectClipping(metrics.waveformData) : false;
  const limiterEngaged = (metrics?.peakLevel ?? 0) >= LIMITER_THRESHOLD;

  return {
    transport: {
      progress,
      elapsedSeconds,
      durationSeconds,
      remainingSeconds,
      isPlaying: metrics?.isPlaying ?? false,
    },
    stereoLevels: {
      leftLevel,
      rightLevel,
      leftPeak,
      rightPeak,
    },
    waveformPeaks,
    mixer: {
      channels: [
        { id: 'deck-a', level: leftLevel, peak: leftPeak },
        { id: 'deck-b', level: rightLevel, peak: rightPeak },
        { id: 'mic', level: leftLevel * 0.35, peak: leftPeak * 0.35 },
        { id: 'aux', level: rightLevel * 0.45, peak: rightPeak * 0.45 },
        { id: 'master', level: Math.max(leftLevel, rightLevel), peak: Math.max(leftPeak, rightPeak) },
      ],
      master: {
        leftLevel,
        rightLevel,
        leftPeak,
        rightPeak,
      },
    },
    signalFlags: {
      clipDetected,
      limiterEngaged,
    },
  };
}

export function createStudioTelemetrySnapshot(metrics: AudioMetrics | null, currentTrack: Track | null): StudioTelemetrySnapshot {
  const telemetry = createDJTelemetry(metrics, currentTrack);

  return {
    waveformPosition: telemetry.transport.progress,
    durationSeconds: telemetry.transport.durationSeconds,
    waveformData: telemetry.waveformPeaks,
  };
}
