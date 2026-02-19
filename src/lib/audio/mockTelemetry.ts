import type { DJTelemetry } from './telemetry';
import { deterministicWaveformSample } from './telemetry';

function seededValue(seed: number): number {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
}

export function createMockTelemetry(tick = 0): DJTelemetry {
  const baseLevel = 0.45 + seededValue(tick + 1) * 0.2;
  const peak = Math.min(0.98, baseLevel + 0.15);
  const progress = ((tick % 600) + 1) / 600;

  return {
    transport: {
      progress,
      elapsedSeconds: progress * 234,
      durationSeconds: 234,
      remainingSeconds: (1 - progress) * 234,
      isPlaying: true,
    },
    stereoLevels: {
      leftLevel: baseLevel,
      rightLevel: baseLevel * 0.95,
      leftPeak: peak,
      rightPeak: peak * 0.97,
    },
    waveformPeaks: deterministicWaveformSample(250, 1337),
    mixer: {
      channels: [
        { id: 'deck-a', level: baseLevel, peak },
        { id: 'deck-b', level: baseLevel * 0.95, peak: peak * 0.95 },
        { id: 'mic', level: baseLevel * 0.25, peak: peak * 0.25 },
        { id: 'aux', level: baseLevel * 0.35, peak: peak * 0.35 },
        { id: 'master', level: peak * 0.9, peak },
      ],
      master: {
        leftLevel: baseLevel,
        rightLevel: baseLevel * 0.95,
        leftPeak: peak,
        rightPeak: peak * 0.97,
      },
    },
    signalFlags: {
      clipDetected: peak > 0.97,
      limiterEngaged: peak > 0.9,
    },
  };
}
