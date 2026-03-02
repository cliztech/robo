// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Studio App with Modular Layout Support
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { DeckProvider, useDeck } from './contexts/DeckContext';
import { SetupCanvas } from './modules/layout/SetupCanvas';
import { MainLayout } from './components/layout/MainLayout';
import { TopNavBar } from './components/layout/TopNavBar';
import { WaveformRail } from './components/shell/waveform-rail';
import { WaveformStrip } from './components/deck/WaveformStrip';
import { DeckContainer } from './components/deck/DeckContainer';
import { DeckInfoPanel } from './components/deck/DeckInfoPanel';
import { JogWheel } from './components/deck/JogWheel';
import { TransportControls } from './components/deck/TransportControls';
import { MixerChannel } from './components/mixer/MixerChannel';
import { Crossfader } from './components/mixer/Crossfader';
import { StemControls } from './components/mixer/StemControls';
import { PerformancePadGrid } from './components/pads/PerformancePadGrid';
import { FXRack } from './components/fx/FXRack';
import { BrowserPanel } from './components/browser/BrowserPanel';
import BroadcastPanel from './components/broadcast/BroadcastPanel';
import { ToastNotification } from './components/ui/ToastNotification';
import type { Toast } from './components/ui/ToastNotification';
import { formatTime } from './data/demoTracks';
import { DECK_COLORS } from './types';
import type { Layout } from './modules/layout/types';
import { LayoutGrid, List } from 'lucide-react';

/** Inner app component */
function DJApp() {
  const {
    decks,
    crossfader,
    engineReady,
    togglePlay,
    setVolume,
    setCrossfader,
    initEngine,
  } = useDeck();

  // View mode: 'classic' or 'modular'
  const [viewMode, setViewMode] = useState<'classic' | 'modular'>('classic');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  }, []);

  // Initialize audio engine
  useEffect(() => {
    const handler = async () => {
      if (!engineReady) {
        await initEngine();
        addToast('Audio engine ready', 'success');
      }
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [engineReady, initEngine, addToast]);

  const deckA = decks.A;
  const deckB = decks.B;

  const timeRemainingA = deckA.track
    ? formatTime(Math.max(0, (deckA.track.duration ?? 0) - deckA.position))
    : '0:00';
  const timeRemainingB = deckB.track
    ? formatTime(Math.max(0, (deckB.track.duration ?? 0) - deckB.position))
    : '0:00';

  const handleLayoutChange = useCallback((layout: Layout) => {
    console.log('Layout changed:', layout.name);
  }, []);

  // Modular View
  if (viewMode === 'modular') {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col">
        {/* Header with view switcher */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">DGN-DJ Studio</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('classic')}
              className="p-2 rounded-lg flex items-center gap-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            >
              <List size={16} />
              Classic
            </button>
            <button
              onClick={() => setViewMode('modular')}
              className="p-2 rounded-lg flex items-center gap-2 bg-blue-600 text-white"
            >
              <LayoutGrid size={16} />
              Modular
            </button>
          </div>
        </div>
        {/* Modular Canvas */}
        <div className="flex-1">
          <SetupCanvas layoutId="2-deck-classic" onLayoutChange={handleLayoutChange} />
        </div>
        <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Classic View
  return (
    <MainLayout>
      {/* View Mode Toggle */}
      <div className="absolute top-2 right-2 z-50 flex gap-2">
        <button
          onClick={() => setViewMode('classic')}
          className="p-2 rounded-lg flex items-center gap-2 bg-blue-600 text-white"
        >
          <List size={16} />
          Classic
        </button>
        <button
          onClick={() => setViewMode('modular')}
          className="p-2 rounded-lg flex items-center gap-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
        >
          <LayoutGrid size={16} />
          Modular
        </button>
      </div>

      {/* TopNav */}
      <TopNavBar />

      {/* Waveform Engine */}
      <div className="flex flex-col">
        <WaveformRail 
          playingA={deckA.playing} 
          playingB={deckB.playing}
          posA={deckA.position / (deckA.track?.duration ?? 1)}
          posB={deckB.position / (deckB.track?.duration ?? 1)}
          className="h-4 border-none bg-transparent"
        />
        <WaveformStrip playingA={deckA.playing} playingB={deckB.playing} />
      </div>

      {/* Decks + Mixer */}
      <div className="flex gap-[--layout-gutter] p-[--layout-padding]" style={{ height: 'var(--layout-decks-h)' }}>
        {/* Left Deck A */}
        <div className="flex-1 min-w-0">
          <DeckContainer deck="A">
            <div className="flex gap-2 h-full">
              <div className="flex flex-col justify-between shrink-0">
                <DeckInfoPanel
                  deck="A"
                  trackTitle={deckA.track?.title}
                  artist={deckA.track?.artist}
                  bpm={deckA.track?.bpm ?? 0}
                  musicalKey={deckA.track?.key}
                  camelotKey={deckA.track?.camelotKey}
                  timeRemaining={timeRemainingA}
                  pitch={deckA.pitch}
                  isMaster={deckA.isMaster}
                  isSynced={deckA.isSynced}
                />
                <TransportControls deck="A" playing={deckA.playing} onPlayPause={() => togglePlay('A')} />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <JogWheel deck="A" playing={deckA.playing} />
              </div>
            </div>
          </DeckContainer>
        </div>

        {/* Mixer */}
        <div className="flex flex-col gap-1.5 shrink-0" style={{ width: 'var(--layout-mixer-w)' }}>
          <div className="flex gap-1 justify-center">
            <StemControls deck="A" />
            <StemControls deck="B" />
          </div>

          <div className="flex-1 flex gap-2 justify-center items-stretch">
            <MixerChannel
              channel={1}
              deck="A"
              volume={deckA.volume}
              onVolumeChange={(v) => setVolume('A', v)}
              accentColor={DECK_COLORS.A}
            />
            <MixerChannel
              channel={2}
              deck="B"
              volume={deckB.volume}
              onVolumeChange={(v) => setVolume('B', v)}
              accentColor={DECK_COLORS.B}
            />
            <MixerChannel
              channel={3}
              deck="C"
              volume={decks.C.volume}
              onVolumeChange={(v) => setVolume('C', v)}
              accentColor={DECK_COLORS.C}
            />
            <MixerChannel
              channel={4}
              deck="D"
              volume={decks.D.volume}
              onVolumeChange={(v) => setVolume('D', v)}
              accentColor={DECK_COLORS.D}
            />
          </div>

          <div className="flex justify-center">
            <Crossfader value={crossfader} onChange={setCrossfader} />
          </div>
        </div>

        {/* Right Deck B */}
        <div className="flex-1 min-w-0">
          <DeckContainer deck="B">
            <div className="flex gap-2 h-full">
              <div className="flex-1 flex items-center justify-center">
                <JogWheel deck="B" playing={deckB.playing} />
              </div>
              <div className="flex flex-col justify-between shrink-0">
                <DeckInfoPanel
                  deck="B"
                  trackTitle={deckB.track?.title}
                  artist={deckB.track?.artist}
                  bpm={deckB.track?.bpm ?? 0}
                  musicalKey={deckB.track?.key}
                  camelotKey={deckB.track?.camelotKey}
                  timeRemaining={timeRemainingB}
                  pitch={deckB.pitch}
                  isMaster={deckB.isMaster}
                  isSynced={deckB.isSynced}
                />
                <TransportControls deck="B" playing={deckB.playing} onPlayPause={() => togglePlay('B')} />
              </div>
            </div>
          </DeckContainer>
        </div>
      </div>

      {/* Pads + FX */}
      <div className="flex gap-[--layout-gutter] px-[--layout-padding]" style={{ height: 'var(--layout-pads-h)' }}>
        <div className="flex-1 min-w-0">
          <PerformancePadGrid deck="A" />
        </div>
        <div className="shrink-0">
          <FXRack deck="A" />
        </div>
        <div className="shrink-0">
          <FXRack deck="B" />
        </div>
        <div className="flex-1 min-w-0">
          <PerformancePadGrid deck="B" />
        </div>
      </div>

      {/* Browser + Broadcast */}
      <div className="flex gap-[--layout-gutter] px-[--layout-padding]" style={{ height: 'var(--layout-browser-h)' }}>
        <div className="min-w-0" style={{ flex: '0 0 60%' }}>
          <BrowserPanel />
        </div>
        <div className="min-w-0 overflow-hidden" style={{ flex: '0 0 calc(40% - var(--layout-gutter, 6px))' }}>
          <BroadcastPanel />
        </div>
      </div>

      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </MainLayout>
  );
}

/** Root app */
function App() {
  return (
    <DeckProvider>
      <DJApp />
    </DeckProvider>
  );
}

export default App;
