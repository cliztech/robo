import { AudioEngine, type Track } from '@/lib/audio/engine';

class FakeAudioBufferSourceNode {
  buffer: { duration: number } | null = null;
  onended: (() => void) | null = null;

  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioParam {
  value = 1;
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  exponentialRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  cancelScheduledValues = vi.fn();
}

class FakeGainNode {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

function createEngineHarness() {
  const engine = new AudioEngine();
  const createdSources: FakeAudioBufferSourceNode[] = [];

  const fakeContext = {
    state: 'running',
    currentTime: 100,
    resume: vi.fn(async () => undefined),
    createBufferSource: vi.fn(() => {
      const source = new FakeAudioBufferSourceNode();
      createdSources.push(source);
      return source as unknown as AudioBufferSourceNode;
    }),
  };

  (engine as unknown as { context: unknown }).context = fakeContext;
  (engine as unknown as { currentGain: unknown }).currentGain = new FakeGainNode() as unknown as GainNode;
  (engine as unknown as { nextGain: unknown }).nextGain = new FakeGainNode() as unknown as GainNode;
  (engine as unknown as { tracks: Map<string, { buffer: { duration: number }; estimatedBytes: number }> }).tracks = new Map([
    ['track-1', { buffer: { duration: 120 }, estimatedBytes: 1000 }],
    ['track-2', { buffer: { duration: 180 }, estimatedBytes: 1000 }],
  ]);
  (engine as unknown as { cacheEstimatedBytes: number }).cacheEstimatedBytes = 2000;

  return { engine, createdSources };
}

const track1: Track = {
  id: 'track-1',
  url: '/track-1.mp3',
  title: 'Track One',
  artist: 'DJ One',
  duration: 120,
};

const track2: Track = {
  id: 'track-2',
  url: '/track-2.mp3',
  title: 'Track Two',
  artist: 'DJ Two',
  duration: 180,
};

describe('AudioEngine source lifecycle handlers', () => {
  it('emits track-ended when a normally played source ends', async () => {
    const { engine } = createEngineHarness();
    const onEnded = vi.fn();
    engine.on('track-ended', onEnded);

    await engine.play(track1);

    const currentSource = (engine as unknown as { currentSource: FakeAudioBufferSourceNode }).currentSource;
    currentSource.onended?.();

    expect(onEnded).toHaveBeenCalledWith({ track: track1 });
  });

  it('emits track-ended after pause and resume when resumed source ends', async () => {
    const { engine } = createEngineHarness();
    const onEnded = vi.fn();
    engine.on('track-ended', onEnded);

    await engine.play(track1);
    engine.pause();
    await engine.resume();

    const resumedSource = (engine as unknown as { currentSource: FakeAudioBufferSourceNode }).currentSource;
    resumedSource.onended?.();

    expect(onEnded).toHaveBeenCalledWith({ track: track1 });
  });

  it('emits track-ended for the promoted source after crossfade completes', async () => {
    vi.useFakeTimers();
    try {
      const { engine } = createEngineHarness();
      const onEnded = vi.fn();
      engine.on('track-ended', onEnded);

      await engine.play(track1);
      await engine.crossfade(track2, 1);
      vi.advanceTimersByTime(1000);

      const promotedSource = (engine as unknown as { currentSource: FakeAudioBufferSourceNode }).currentSource;
      promotedSource.onended?.();

      expect(onEnded).toHaveBeenCalledWith({ track: track2 });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('AudioEngine cache eviction', () => {
  const baseTrack = {
    url: '/track.mp3',
    title: 'Track',
    artist: 'Artist',
    duration: 120,
  };

  function createCachedEngine(config?: ConstructorParameters<typeof AudioEngine>[0]) {
    const engine = new AudioEngine({ cacheMaxEntries: 2, ...config });
    const trackCache = new Map<string, { buffer: { duration: number; length: number; numberOfChannels: number }; estimatedBytes: number }>();

    const insert = (id: string) => {
      const buffer = { duration: 60, length: 100, numberOfChannels: 2 };
      trackCache.set(id, { buffer, estimatedBytes: 100 * 2 * Float32Array.BYTES_PER_ELEMENT });
    };

    insert('t1');
    insert('t2');

    (engine as unknown as { tracks: typeof trackCache }).tracks = trackCache;
    (engine as unknown as { cacheEstimatedBytes: number }).cacheEstimatedBytes =
      Array.from(trackCache.values()).reduce((total, entry) => total + entry.estimatedBytes, 0);

    return { engine, trackCache, insert };
  }

  it('evicts least recently used track when max entries is exceeded', async () => {
    const { engine } = createCachedEngine();
    const cacheEvents: Array<{ type: string; trackId: string }> = [];
    engine.on('cache-telemetry', (event) => cacheEvents.push({ type: event.type, trackId: event.trackId }));

    const fakeContext = {
      decodeAudioData: vi.fn(async () => ({ duration: 75, length: 100, numberOfChannels: 2 })),
    };
    (engine as unknown as { context: unknown }).context = fakeContext;

    // Make t1 most-recently-used; t2 should be evicted.
    await engine.loadTrack({ ...baseTrack, id: 't1' });

    global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch;
    await engine.loadTrack({ ...baseTrack, id: 't3' });

    const tracks = (engine as unknown as { tracks: Map<string, unknown> }).tracks;
    expect(tracks.has('t1')).toBe(true);
    expect(tracks.has('t2')).toBe(false);
    expect(tracks.has('t3')).toBe(true);
    expect(cacheEvents.some((event) => event.type === 'eviction' && event.trackId === 't2')).toBe(true);
  });

  it('does not evict current track during active playback', async () => {
    const { engine, insert } = createCachedEngine();
    insert('t3');

    const tracks = (engine as unknown as { tracks: Map<string, unknown> }).tracks;
    (engine as unknown as { currentTrack: Track | null }).currentTrack = { ...baseTrack, id: 't1' };
    (engine as unknown as { cacheEstimatedBytes: number }).cacheEstimatedBytes = 3 * 100 * 2 * Float32Array.BYTES_PER_ELEMENT;

    (engine as unknown as { evictTracksIfNeeded: () => void }).evictTracksIfNeeded();

    expect(tracks.has('t1')).toBe(true);
    expect(tracks.size).toBe(2);
  });
});
