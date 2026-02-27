import { render } from '@testing-library/react';
import { DJStudioSurface } from '@/components/console/DJStudioSurface';
import { DegenTransport } from '@/components/audio/DegenTransport';

const SKINS = ['dark', 'light'] as const;

describe('console core surface visual regression by skin', () => {
  for (const skin of SKINS) {
    it(`matches deck/mixer/library/transport snapshots for ${skin} skin`, () => {
      const { container } = render(
        <div data-theme={skin}>
          <DJStudioSurface />
          <DegenTransport isOnAir={skin === 'dark'} />
        </div>
      );

      const deckSurfaces = Array.from(container.querySelectorAll('.dj-area-deck-a section, .dj-area-deck-b section'));
      const mixerSurface = container.querySelector('.dj-area-mixer');
      const librarySurface = container.querySelector('.dj-area-library');
      const transportSurface = container.querySelector('[aria-label="Playback position"]')?.closest('div.h-16');

      expect(deckSurfaces.map((surface) => surface.outerHTML)).toMatchSnapshot(`${skin}-decks`);
      expect(mixerSurface?.outerHTML).toMatchSnapshot(`${skin}-mixer`);
      expect(librarySurface?.outerHTML).toMatchSnapshot(`${skin}-library`);
      expect(transportSurface?.outerHTML).toMatchSnapshot(`${skin}-transport`);
    });
  }
});
