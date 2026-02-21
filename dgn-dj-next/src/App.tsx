import { useState, useCallback } from 'react';
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

function App() {
  // Deck state
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [volumeA, setVolumeA] = useState(80);
  const [volumeB, setVolumeB] = useState(75);
  const [volumeC, setVolumeC] = useState(0);
  const [volumeD, setVolumeD] = useState(0);
  const [crossfader, setCrossfader] = useState(50);

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([
    { id: '1', message: 'Engine ready', type: 'success', duration: 3000 },
  ]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <MainLayout>
      {/* ═══ ROW 1: TopNav — ~3% viewport ═══ */}
      <TopNavBar />

      {/* ═══ ROW 2: Waveform Engine — ~37.6% viewport ═══ */}
      <WaveformStrip playingA={playingA} playingB={playingB} />

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
                  trackTitle="Strobe"
                  artist="deadmau5"
                  bpm={128.00}
                  musicalKey="Am"
                  camelotKey="8A"
                  timeRemaining="3:42"
                  pitch={0.0}
                  isMaster
                  isSynced
                />
                <TransportControls deck="A" playing={playingA} onPlayPause={() => setPlayingA(!playingA)} />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <JogWheel deck="A" playing={playingA} />
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
          <div className="flex-1 flex gap-[8px] justify-center items-stretch">
            <MixerChannel channel={1} deck="A" volume={volumeA} onVolumeChange={setVolumeA} accentColor="#0091FF" />
            <MixerChannel channel={2} deck="B" volume={volumeB} onVolumeChange={setVolumeB} accentColor="#FF5500" />
            <MixerChannel channel={3} deck="C" volume={volumeC} onVolumeChange={setVolumeC} accentColor="#2ECC71" />
            <MixerChannel channel={4} deck="D" volume={volumeD} onVolumeChange={setVolumeD} accentColor="#9B59B6" />
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
                <JogWheel deck="B" playing={playingB} />
              </div>
              <div className="flex flex-col justify-between shrink-0">
                <DeckInfoPanel
                  deck="B"
                  trackTitle="Midnight City"
                  artist="M83"
                  bpm={126.50}
                  musicalKey="Dbm"
                  camelotKey="3B"
                  timeRemaining="5:18"
                  pitch={-1.2}
                  isSynced
                />
                <TransportControls deck="B" playing={playingB} onPlayPause={() => setPlayingB(!playingB)} />
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

export default App;
