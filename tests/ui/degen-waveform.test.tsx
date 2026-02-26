import { render, screen } from '@testing-library/react';
import { DegenWaveform } from '@/components/audio/DegenWaveform';

describe('DegenWaveform visual parity and singleton markers', () => {
  it('renders one playing indicator and one playhead instance', () => {
    render(
      <DegenWaveform
        trackTitle="Parity Check"
        isPlaying
        waveformData={[0.2, 0.4, 0.3, 0.5]}
      />
    );

    expect(screen.getAllByTestId('deck-playing-indicator')).toHaveLength(1);
    expect(screen.getAllByTestId('waveform-playhead')).toHaveLength(1);
  });

  it('applies deck-specific accent tokens consistently for deck A and B', () => {
    const { rerender } = render(
      <DegenWaveform
        deck="A"
        trackTitle="Deck A"
        isPlaying
        progress={0.42}
        waveformData={[0.2, 0.4, 0.3, 0.5]}
      />
    );

    const deckAIndicatorDot = screen
      .getByTestId('deck-playing-indicator')
      .querySelector('div');
    const deckAPlayheadLine = screen
      .getByTestId('waveform-playhead')
      .querySelector('div');

    expect(deckAIndicatorDot).toHaveStyle({ backgroundColor: 'hsl(var(--color-deck-a))' });
    expect(deckAPlayheadLine).toHaveStyle({ backgroundColor: 'hsl(var(--color-deck-a))' });

    rerender(
      <DegenWaveform
        deck="B"
        trackTitle="Deck B"
        isPlaying
        progress={0.42}
        waveformData={[0.2, 0.4, 0.3, 0.5]}
      />
    );

    const deckBIndicatorDot = screen
      .getByTestId('deck-playing-indicator')
      .querySelector('div');
    const deckBPlayheadLine = screen
      .getByTestId('waveform-playhead')
      .querySelector('div');

    expect(deckBIndicatorDot).toHaveStyle({ backgroundColor: 'hsl(var(--color-deck-b))' });
    expect(deckBPlayheadLine).toHaveStyle({ backgroundColor: 'hsl(var(--color-deck-b))' });
  });
});
