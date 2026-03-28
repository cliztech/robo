import { createTelemetryChannelMap } from '@/components/audio/DegenMixer';

describe('createTelemetryChannelMap', () => {
  it('returns empty map for malformed telemetry payloads', () => {
    expect(createTelemetryChannelMap(null).size).toBe(0);
    expect(createTelemetryChannelMap({ channels: [] }).size).toBe(0);
    expect(createTelemetryChannelMap([{ id: 'deck-a', level: 'bad', peak: 0.8 }]).size).toBe(0);
  });

  it('keeps only valid channel telemetry entries', () => {
    const map = createTelemetryChannelMap([
      { id: 'deck-a', level: 0.6, peak: 0.8 },
      { id: 'deck-b', level: Number.NaN, peak: 0.5 },
      { id: 'deck-c', level: 0.7, peak: 0.9 },
    ]);

    expect([...map.keys()]).toEqual(['deck-a', 'deck-c']);
  });
});
