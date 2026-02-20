import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DeckContainer } from './components/deck/DeckContainer';
import { Knob } from './components/ui/Knob';
import { Fader } from './components/ui/Fader';
import { Button } from './components/ui/Button';

function App() {
  const [volA, setVolA] = useState(80);
  const [volB, setVolB] = useState(80);
  const [xfader, setXfader] = useState(50);

  return (
    <MainLayout>
      {/* DECK A */}
      <DeckContainer deck="A" className="p-4">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-deck-a font-bold text-xl tracking-tighter">DECK A</h2>
            <div className="text-xs font-mono text-deck-a">DISCONNECTED</div>
          </div>

          <div className="flex-1 flex items-center justify-center border border-white/5 rounded-lg bg-black/20">
            <span className="text-gray-600 font-mono text-xs">WAVEFORM ENGINE PENDING</span>
          </div>

          <div className="mt-auto flex justify-between items-end">
            <Button variant="deck-a" size="xl">PLAY</Button>
            <Button variant="outline" size="xl" className="border-deck-a/50 text-deck-a hover:bg-deck-a/10">CUE</Button>
          </div>
        </div>
      </DeckContainer>

      {/* MIXER */}
      <div className="flex flex-col bg-[#111] rounded-lg border border-[#222] p-2 relative overflow-hidden">
        {/* Brushed metal texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>

        <div className="relative z-10 flex flex-row h-full justify-evenly pt-4 pb-2">
          {/* Channel A Strip */}
          <div className="flex flex-col items-center gap-6">
            <Knob value={volA} onChange={setVolA} label="GAIN" size={40} color="neutral" />
            <Knob value={75} onChange={() => { }} label="HIGH" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="MID" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="LOW" size={40} color="neutral" />
            <div className="flex-1 flex items-end">
              <Fader value={volA} onChange={setVolA} height={180} color="deck-a" />
            </div>
          </div>

          {/* Master Strip */}
          <div className="flex flex-col items-center gap-4 justify-center">
            <div className="w-12 h-64 bg-black/50 border border-white/5 rounded flex flex-col justify-end p-1">
              {/* VU Meter Placeholder */}
              <div className="w-full h-[60%] bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 opacity-50"></div>
            </div>
          </div>

          {/* Channel B Strip */}
          <div className="flex flex-col items-center gap-6">
            <Knob value={volB} onChange={setVolB} label="GAIN" size={40} color="neutral" />
            <Knob value={75} onChange={() => { }} label="HIGH" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="MID" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="LOW" size={40} color="neutral" />
            <div className="flex-1 flex items-end">
              <Fader value={volB} onChange={setVolB} height={180} color="deck-b" />
            </div>
          </div>
        </div>

        {/* Crossfader */}
        <div className="h-16 border-t border-white/5 flex items-center justify-center px-8 relative z-10">
          <input
            type="range"
            min="0"
            max="100"
            value={xfader}
            onChange={(e) => setXfader(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-400"
          />
        </div>
      </div>

      {/* DECK B */}
      <DeckContainer deck="B" className="p-4">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-deck-b font-bold text-xl tracking-tighter">DECK B</h2>
            <div className="text-xs font-mono text-deck-b">DISCONNECTED</div>
          </div>

          <div className="flex-1 flex items-center justify-center border border-white/5 rounded-lg bg-black/20">
            <span className="text-gray-600 font-mono text-xs">WAVEFORM ENGINE PENDING</span>
          </div>

          <div className="mt-auto flex justify-between items-end">
            <Button variant="deck-b" size="xl">PLAY</Button>
            <Button variant="outline" size="xl" className="border-deck-b/50 text-deck-b hover:bg-deck-b/10">CUE</Button>
          </div>
        </div>
      </DeckContainer>
    </MainLayout>
  );
}

export default App;
