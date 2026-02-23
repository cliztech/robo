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
  (engine as unknown as { tracks: Map<string, { duration: number }> }).tracks = new Map([
    ['track-1', { duration: 120 }],
    ['track-2', { duration: 180 }],
  ]);

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
