import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DeckContainer } from './components/deck/DeckContainer';
import { WaveformCanvas } from './components/deck/WaveformCanvas';
import { Button } from './components/ui/Button';
import { MixerChannel } from './components/mixer/MixerChannel';
import { StemControls } from './components/mixer/StemControls';
import { cn } from './lib/utils';

function App() {
  const [volA, setVolA] = useState(80);
  const [volB, setVolB] = useState(80);
  const [xfader, setXfader] = useState(50);

  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);

  return (
    <MainLayout>
      {/* DECK A */}
      <DeckContainer deck="A" className="p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-14 bg-gradient-to-r from-[#001020] to-[#0a0a0a] border-b border-[#222] flex items-center justify-between px-4 shrink-0">
            <div className="text-[40px] font-black text-[#001F4D] absolute left-2 top-0 pointer-events-none select-none z-0">1</div>
            <div className="z-10 relative pl-8">
              <div className="text-deck-a/20 text-[10px] font-bold tracking-widest mb-0.5">TRACK TITLE</div>
              <div className="text-white font-bold text-lg tracking-tight leading-none drop-shadow-md">SOLARIS</div>
              <div className="text-deck-a/60 text-xs font-medium">CamelPhat, ARTBAT</div>
            </div>
            <div className="z-10 flex flex-col items-end">
              <div className="bg-[#001020] px-2 py-0.5 rounded border border-deck-a/30 text-deck-a font-mono font-bold text-sm">124.00</div>
            </div>
          </div>

          {/* Waveform */}
          <div className="h-40 border-b border-[#222] relative shrink-0">
            <WaveformCanvas deck="A" playing={playingA} />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white z-20 shadow-[0_0_8px_white]"></div>
          </div>

          {/* Controls */}
          <div className="flex-1 bg-[#090909] flex flex-col items-center justify-between p-6 pb-6 relative">

            {/* Jog Wheel */}
            <div className="relative w-56 h-56 rounded-full border-[2px] border-[#222] bg-[#111] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-full border-[4px] border-deck-a/30 shadow-[0_0_20px_rgba(0,145,255,0.2)]"></div>
              {/* Inner Platter */}
              <div className={cn("w-40 h-40 rounded-full bg-black flex items-center justify-center relative z-10 border border-[#222]", playingA && "animate-[spin_4s_linear_infinite]")}>
                <div className="absolute inset-0 w-full h-full rounded-full border-t-2 border-deck-a/80"></div>
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">03:45</div>
              </div>
            </div>

            {/* Transport */}
            <div className="w-full flex justify-between items-end px-8 mt-6">
              <Button
                variant="outline"
                size="xl"
                className="w-20 h-20 rounded-full border-2 border-[#333] hover:border-deck-a bg-[#151515] active:scale-95 transition-all text-gray-400 hover:text-white"
              >
                CUE
              </Button>
              <Button
                variant={playingA ? "deck-a" : "outline"}
                size="xl"
                className={cn("w-20 h-20 rounded-full border-2 active:scale-95 transition-all", playingA ? "border-deck-a shadow-[0_0_20px_rgba(0,145,255,0.4)]" : "border-[#333] bg-[#151515] text-white hover:border-deck-a")}
                onClick={() => setPlayingA(!playingA)}
              >
                {playingA ? "PAUSE" : "PLAY"}
              </Button>
            </div>
          </div>
        </div>
      </DeckContainer>

      {/* MIXER */}
      <div className="flex flex-col bg-brushed-metal rounded-lg border border-[#222] p-2 relative overflow-hidden">

        {/* Helper Header for Stems */}
        <div className="flex justify-between px-2 pb-2 border-b border-white/5 mb-2">
          <StemControls deck="A" className="flex-1" />
          <div className="w-2"></div>
          <StemControls deck="B" className="flex-1" />
        </div>

        <div className="relative z-10 flex flex-row h-full justify-evenly pt-2 pb-2">
          {/* Channel A Strip */}
          <MixerChannel deck="A" volume={volA} onVolumeChange={setVolA} />

          {/* Master Strip */}
          <div className="flex flex-col items-center gap-4 justify-center w-[60px]">
            <div className="w-10 h-64 bg-black/50 border border-white/5 rounded flex flex-col justify-end p-1 gap-[1px]">
              {/* VU Meter Simulation */}
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className={cn("w-full h-1 rounded-[1px]", i > 10 ? "bg-red-500" : i > 5 ? "bg-yellow-500" : "bg-green-500", i > (volA / 100) * 15 + 2 && "opacity-20")}></div>
              ))}
            </div>
          </div>

          {/* Channel B Strip */}
          <MixerChannel deck="B" volume={volB} onVolumeChange={setVolB} />
        </div>

        {/* Crossfader */}
        <div className="h-20 border-t border-white/5 flex items-center justify-center px-12 relative z-10 bg-black/20 shrink-0">
          <input
            type="range"
            min="0"
            max="100"
            value={xfader}
            onChange={(e) => setXfader(Number(e.target.value))}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      {/* DECK B */}
      <DeckContainer deck="B" className="p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-14 bg-gradient-to-l from-[#200a00] to-[#0a0a0a] border-b border-[#222] flex items-center justify-between px-4 shrink-0">
            <div className="z-10 flex flex-col items-start">
              <div className="bg-[#200a00] px-2 py-0.5 rounded border border-deck-b/30 text-deck-b font-mono font-bold text-sm">125.00</div>
            </div>
            <div className="z-10 relative pr-8 text-right">
              <div className="text-deck-b/20 text-[10px] font-bold tracking-widest mb-0.5">TRACK TITLE</div>
              <div className="text-white font-bold text-lg tracking-tight leading-none drop-shadow-md">BREATHE</div>
              <div className="text-deck-b/60 text-xs font-medium">CamelPhat, Jem Cooke</div>
            </div>
            <div className="text-[40px] font-black text-[#331100] absolute right-2 top-0 pointer-events-none select-none z-0">2</div>
          </div>

          {/* Waveform */}
          <div className="h-40 border-b border-[#222] relative shrink-0">
            <WaveformCanvas deck="B" playing={playingB} />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-red-500/80 z-20 shadow-[0_0_8px_red]"></div>
          </div>

          {/* Controls */}
          <div className="flex-1 bg-[#090909] flex flex-col items-center justify-between p-6 pb-6 relative">

            {/* Jog Wheel */}
            <div className="relative w-56 h-56 rounded-full border-[2px] border-[#222] bg-[#111] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-full border-[4px] border-deck-b/30 shadow-[0_0_20px_rgba(255,85,0,0.2)]"></div>
              {/* Inner Platter */}
              <div className={cn("w-40 h-40 rounded-full bg-black flex items-center justify-center relative z-10 border border-[#222]", playingB && "animate-[spin_4s_linear_infinite]")}>
                <div className="absolute inset-0 w-full h-full rounded-full border-t-2 border-deck-b/80"></div>
                <div className="text-3xl font-mono font-bold text-zinc-400 tracking-tighter">00:00</div>
              </div>
            </div>

            {/* Transport */}
            <div className="w-full flex justify-between items-end px-8 mt-6">
              <Button
                variant="outline"
                size="xl"
                className="w-20 h-20 rounded-full border-2 border-[#333] hover:border-deck-b bg-[#151515] active:scale-95 transition-all text-gray-400 hover:text-white"
              >
                CUE
              </Button>
              <Button
                variant={playingB ? "deck-b" : "outline"}
                size="xl"
                className={cn("w-20 h-20 rounded-full border-2 active:scale-95 transition-all", playingB ? "border-deck-b shadow-[0_0_20px_rgba(255,85,0,0.4)]" : "border-[#333] bg-[#151515] text-white hover:border-deck-b")}
                onClick={() => setPlayingB(!playingB)}
              >
                {playingB ? "PAUSE" : "PLAY"}
              </Button>
            </div>
          </div>
        </div>
      </DeckContainer>
    </MainLayout>
  );
}

export default App;
