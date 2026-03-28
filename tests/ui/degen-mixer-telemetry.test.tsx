import type { DJTelemetry } from '@/lib/audio/telemetry';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DegenMixer } from '@/components/audio/DegenMixer';
import { coerceMixerChannelTelemetry } from '@/lib/audio/telemetry';

vi.mock('@/stores/studioState', () => ({
  useStudioStore: (selector: (state: unknown) => unknown) =>
    selector({
      mixer: {
        channels: {
          'deck-a': { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
          'deck-b': { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
          mic: { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
          aux: { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
          master: { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
        },
      },
      telemetry: undefined,
      setChannelGain: vi.fn(),
      setChannelEq: vi.fn(),
      setCrossfader: vi.fn(),
    }),
}));

describe('coerceMixerChannelTelemetry', () => {
  it('drops invalid channel rows and keeps valid ones', () => {
    const channels = coerceMixerChannelTelemetry([
      { id: 'deck-a', level: 0.3, peak: 0.4 },
      { id: 'deck-b', level: 'bad', peak: 0.7 },
      { id: 4, level: 0.2, peak: 0.3 },
      { id: 'mic', level: 0.25, peak: 0.31 },
    ] as unknown);

    expect(channels).toEqual([
      { id: 'deck-a', level: 0.3, peak: 0.4 },
      { id: 'mic', level: 0.25, peak: 0.31 },
    ]);
  });

  it('returns empty array for non-array payloads', () => {
    expect(coerceMixerChannelTelemetry({ channels: [] })).toEqual([]);
  });
});

describe('DegenMixer telemetry fallback', () => {
  it('renders mixer when telemetry payload shape is malformed', () => {
    render(
      <DegenMixer
        telemetry={{
          mixer: {
            channels: [{ id: 'deck-a', level: 'bad', peak: 0.8 }],
            master: { leftLevel: 0, rightLevel: 0, leftPeak: 0, rightPeak: 0 },
          },
        } as unknown as DJTelemetry}
      />,
    );

    expect(screen.getByText('Mixer Console')).toBeTruthy();
    expect(screen.getByLabelText('DECK A volume')).toBeTruthy();
  });
});
