import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DegenTransport } from '@/components/audio/DegenTransport';
import { DegenWaveform } from '@/components/audio/DegenWaveform';

describe('DJ transport and cue controls', () => {
  it('fires deck transport callbacks for previous/play-next actions', async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onPlayPause = vi.fn();
    const onNext = vi.fn();

    render(
      <DegenTransport
        isPlaying={false}
        onPrev={onPrev}
        onPlayPause={onPlayPause}
        onNext={onNext}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Previous track' }));
    await user.click(screen.getByRole('button', { name: 'Start playback' }));
    await user.click(screen.getByRole('button', { name: 'Next track' }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onPlayPause).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('supports accessible labels, keyboard activation, and focus utility classes', async () => {
    const user = userEvent.setup();
    const onPlayPause = vi.fn();

    render(<DegenTransport isPlaying={false} onPlayPause={onPlayPause} />);

    const playButton = screen.getByRole('button', { name: 'Start playback' });
    const progressSlider = screen.getByRole('slider', { name: 'Playback position' });

    expect(playButton).toHaveClass('focus-visible:ring-2');
    playButton.focus();
    expect(playButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onPlayPause).toHaveBeenCalledTimes(1);
    expect(progressSlider).toBeInTheDocument();
  });

  it('fires cue seek callback from cue point controls', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();

    render(
      <DegenWaveform
        waveformData={[0.2, 0.4, 0.3, 0.5]}
        cuePoints={[
          { label: 'Intro', position: 0.12, color: '#f97316' },
          { label: 'Drop', position: 0.58, color: '#a855f7' },
        ]}
        onSeek={onSeek}
      />
    );

    const dropCue = screen.getByRole('button', { name: 'Drop' });
    dropCue.focus();
    await user.keyboard('{Enter}');

    expect(onSeek).toHaveBeenCalledWith(0.58);
  });
});
