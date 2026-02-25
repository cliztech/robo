import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DegenTransport } from '@/components/audio/DegenTransport';
import type { DJTelemetry } from '@/lib/audio/telemetry';

const buildTelemetry = (progress: number): DJTelemetry => ({
  timestamp: Date.now(),
  transport: {
    elapsedSeconds: progress * 200,
    durationSeconds: 200,
    remainingSeconds: (1 - progress) * 200,
    progress,
    deck: 'A',
    state: 'playing',
  },
  stereoLevels: {
    leftLevel: 0.5,
    rightLevel: 0.5,
    leftPeak: 0.5,
    rightPeak: 0.5,
  },
  signalFlags: {
    clipDetected: false,
    limiterEngaged: false,
    silenceDetected: false,
  },
  aiHost: {
    speaking: false,
    confidence: 0,
    segmentId: null,
  },
  moderation: {
    state: 'clean',
    reason: null,
    holdSeconds: 0,
  },
  automation: {
    mode: 'assist',
    activePersona: null,
    pendingActions: 0,
  },
});

describe('DegenTransport seek behavior', () => {
  it('updates visual progress immediately while dragging the slider', () => {
    render(<DegenTransport telemetry={buildTelemetry(0.2)} />);

    const slider = screen.getByRole('slider', { name: /Playback position/i });
    const progressFill = screen.getByTestId('transport-progress-fill');

    fireEvent.change(slider, { target: { value: '0.74' } });

    expect(slider).toHaveValue('0.74');
    expect(progressFill).toHaveStyle({ width: '74%' });
  });

  it('calls onSeek on slider commit', () => {
    const onSeek = vi.fn();

    render(<DegenTransport telemetry={buildTelemetry(0.2)} onSeek={onSeek} />);

    const slider = screen.getByRole('slider', { name: /Playback position/i });

    fireEvent.change(slider, { target: { value: '0.61' } });
    fireEvent.mouseUp(slider, { currentTarget: { value: '0.61' } });

    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(0.61);
  });

  it('renders track key text exactly once from resolved track data', () => {
    render(
      <DegenTransport
        currentTrack={{
          title: 'Signal Bloom',
          artist: 'Luma',
          key: '11A',
          duration: 240,
        }}
      />
    );

    expect(screen.getAllByText('11A')).toHaveLength(1);
  });
});
