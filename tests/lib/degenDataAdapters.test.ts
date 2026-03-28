import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultEffectValues,
  buildDefaultMixerState,
  createDeterministicWaveform,
  DEFAULT_MIXER_CHANNELS,
  DEFAULT_TRANSPORT_TELEMETRY,
  DEFAULT_TRANSPORT_TRACK,
  resolveScheduleCurrentHour,
  resolveScheduleSegmentData,
  resolveTrackLibraryData,
  resolveTransportTelemetry,
  resolveTransportTrack,
} from '@/lib/degenDataAdapters';

describe('degenDataAdapters', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns explicit track list when provided', () => {
    const tracks = [
      { id: 'x', title: 't', artist: 'a', bpm: 120, key: '8A', duration: 180, genre: 'house', energy: 7 },
    ];

    expect(resolveTrackLibraryData(tracks)).toEqual(tracks);
  });

  it('returns explicit schedule data when provided', () => {
    const segments = [{ id: 's1', type: 'music', title: 'set', startHour: 2, durationMinutes: 60 }];
    expect(resolveScheduleSegmentData(segments)).toEqual(segments);
  });

  it('resolves current hour from explicit value', () => {
    expect(resolveScheduleCurrentHour(14.25)).toBe(14.25);
  });

  it('returns fallback transport track when demo data disabled', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DEGEN_DEMO_DATA', 'false');

    expect(resolveTransportTrack()).toEqual({ title: 'No track loaded', artist: '—' });
  });

  it('returns provided track and telemetry overrides merged with defaults', () => {
    const track = { title: 'Signal Bloom', artist: 'Luma' };
    const telemetry = { progress: 0.2 };

    expect(resolveTransportTrack(track)).toEqual(track);
    expect(resolveTransportTelemetry(telemetry)).toEqual({
      ...DEFAULT_TRANSPORT_TELEMETRY,
      progress: 0.2,
    });
  });

  it('builds deterministic mixer state for all channels', () => {
    const state = buildDefaultMixerState(DEFAULT_MIXER_CHANNELS);

    expect(Object.keys(state)).toEqual(DEFAULT_MIXER_CHANNELS.map((c) => c.id));
    expect(state.master.volume).toBe(80);
    expect(state['deck-a'].volume).toBe(70);
  });

  it('creates bounded deterministic waveform with requested length', () => {
    const waveform = createDeterministicWaveform(64);

    expect(waveform).toHaveLength(64);
    expect(Math.min(...waveform)).toBeGreaterThanOrEqual(0.04);
    expect(Math.max(...waveform)).toBeLessThanOrEqual(1);
  });

  it('creates deterministic effect defaults keyed by control names', () => {
    const values = buildDefaultEffectValues(['wet', 'feedback', 'rate']);

    expect(values).toEqual({ wet: 40, feedback: 50, rate: 60 });
  });

  it('exports baseline defaults for transport', () => {
    expect(DEFAULT_TRANSPORT_TRACK.title).toBeTruthy();
    expect(DEFAULT_TRANSPORT_TELEMETRY.progress).toBeGreaterThanOrEqual(0);
  });
});
