import { useCallback, useEffect } from 'react';
import { DeckProvider, useDeck } from './contexts/DeckContext';
import { MainLayout } from './components/layout/MainLayout';
import { TopNavBar } from './components/layout/TopNavBar';
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
import { useState } from 'react';
import { formatTime } from './data/demoTracks';
import { DECK_COLORS } from './types';

/** Inner app component — has access to DeckContext */
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

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  }, []);

  // Initialize audio engine on first user interaction
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

  // Compute remaining time
  const timeRemainingA = deckA.track
    ? formatTime(Math.max(0, (deckA.track.duration ?? 0) - deckA.position))
    : '0:00';
  const timeRemainingB = deckB.track
    ? formatTime(Math.max(0, (deckB.track.duration ?? 0) - deckB.position))
    : '0:00';

  return (
    <MainLayout>
      {/* ═══ ROW 1: TopNav — ~3% viewport ═══ */}
      <TopNavBar />

      {/* ═══ ROW 2: Waveform Engine — ~37.6% viewport ═══ */}
      <WaveformStrip playingA={deckA.playing} playingB={deckB.playing} />

      {/* ═══ ROW 3: Decks + Mixer — ~24% viewport ═══ */}
      <div className="flex gap-[--layout-gutter] p-[--layout-padding]"
        style={{ height: 'var(--layout-decks-h)' }}>

        {/* ── Left Deck (A) ── */}
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

        {/* ── Center: 4-Channel Mixer Core — 26% width ── */}
        <div className="flex flex-col gap-1.5 shrink-0" style={{ width: 'var(--layout-mixer-w)' }}>
          {/* Stem controls */}
          <div className="flex gap-1 justify-center">
            <StemControls deck="A" />
            <StemControls deck="B" />
          </div>

          {/* 4 Channel Strips */}
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

          {/* Crossfader */}
          <div className="flex justify-center">
            <Crossfader value={crossfader} onChange={setCrossfader} />
          </div>
        </div>

        {/* ── Right Deck (B) ── */}
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

      {/* ═══ ROW 4: Performance Pads + FX — ~15.9% viewport ═══ */}
      <div className="flex gap-[--layout-gutter] px-[--layout-padding]"
        style={{ height: 'var(--layout-pads-h)' }}>
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

      {/* ═══ ROW 5: Browser (60%) + Broadcast Panel (40%) — ~19.4% viewport ═══ */}
      <div className="flex gap-[--layout-gutter] px-[--layout-padding]" style={{ height: 'var(--layout-browser-h)' }}>
        <div className="min-w-0" style={{ flex: '0 0 60%' }}>
          <BrowserPanel />
        </div>
        <div className="min-w-0 overflow-hidden" style={{ flex: '0 0 calc(40% - var(--layout-gutter, 6px))' }}>
          <BroadcastPanel />
        </div>
      </div>

      {/* Toast Notifications (fixed overlay) */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </MainLayout>
  );
}

/** Root app with DeckProvider wrapper */
function App() {
  return (
    <DeckProvider>
      <DJApp />
    </DeckProvider>
  );
}

export default App;
