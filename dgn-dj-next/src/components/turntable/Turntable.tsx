// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Turntable Component
//  Vinyl turntable simulation with platter, tonearm, slip mat
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface TurntableProps {
  deck: 'A' | 'B';
  playing?: boolean;
  position?: number;
  bpm?: number;
  pitch?: number;
  musicalKey?: string;
  timeRemaining?: string;
  // Turntable specific
  rpm?: 33 | 45 | 78;
  motorOn?: boolean;
  slipMode?: boolean;
  // Callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onCue?: () => void;
  onSeek?: (position: number) => void;
  onPitchChange?: (pitch: number) => void;
  onScratch?: (delta: number) => void;
}

export const Turntable: React.FC<TurntableProps> = ({
  deck,
  playing = false,
  position = 0,
  bpm = 33.33,
  pitch = 0,
  musicalKey = '8A',
  timeRemaining = '-3:42',
  rpm = 33,
  motorOn = true,
  slipMode = false,
  onPlay,
  onPause,
  onCue,
  onSeek,
  onPitchChange,
  onScratch,
}) => {
  const [rotation, setRotation] = useState(0);
  const [tonearmPosition, setTonearmPosition] = useState(0); // 0 = rest, 100 = playing
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const platterRef = useRef<HTMLDivElement>(null);
  const lastAngle = useRef(0);
  const slipModeActive = useRef(false);

  const accentColor = deck === 'A' ? '#0091FF' : '#FF5500';
  const platterSize = 360;

  // Calculate RPM rotation speed
  const getRotationSpeed = useCallback(() => {
    const pitchMultiplier = 1 + (pitch / 100);
    const baseRPM = rpm * pitchMultiplier;
    return (baseRPM / 60) * 6; // degrees per 100ms
  }, [rpm, pitch]);

  // Platter spin animation
  useEffect(() => {
    if (!motorOn || !playing) {
      setIsSpinning(false);
      return;
    }

    setIsSpinning(true);
    const interval = setInterval(() => {
      setRotation(prev => prev + getRotationSpeed());
    }, 100);

    return () => clearInterval(interval);
  }, [motorOn, playing, getRotationSpeed]);

  // Get angle from mouse position
  const getAngle = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!platterRef.current) return 0;
    const rect = platterRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }, []);

  // Handle platter interaction (scratch/bump)
  const handlePlatterMouseDown = useCallback((e: React.MouseEvent) => {
    if (!motorOn) return;
    setIsDragging(true);
    lastAngle.current = getAngle(e);
    
    // Enter slip mode if not playing
    if (!playing && slipMode) {
      slipModeActive.current = true;
    }

    const handleMove = (ev: MouseEvent) => {
      const newAngle = getAngle(ev);
      const delta = newAngle - lastAngle.current;
      
      // Trigger scratch callback
      onScratch?.(delta);
      
      // Rotate platter visually
      setRotation(prev => prev + delta);
      lastAngle.current = newAngle;
    };

    const handleUp = () => {
      setIsDragging(false);
      slipModeActive.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [motorOn, playing, slipMode, getAngle, onScratch]);

  // Handle tonearm
  const handleTonearmClick = useCallback(() => {
    if (tonearmPosition < 50) {
      // Cue up
      setTonearmPosition(100);
      onCue?.();
    } else {
      // Drop needle
      setTonearmPosition(80);
    }
  }, [tonearmPosition, onCue]);

  // Pitch slider
  const handlePitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPitchChange?.(parseFloat(e.target.value));
  }, [onPitchChange]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-2 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-900 rounded">
        <span className="text-sm font-medium text-zinc-300">TURNTABLE {deck}</span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded ${motorOn ? 'bg-green-900 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
            {motorOn ? 'ON' : 'OFF'}
          </span>
          <span className="text-xs text-zinc-500">{rpm} RPM</span>
        </div>
      </div>

      {/* Main turntable area */}
      <div className="flex-1 flex gap-2">
        {/* Platter */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Platter base */}
          <div 
            ref={platterRef}
            className={`relative cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ width: platterSize, height: platterSize }}
            onMouseDown={handlePlatterMouseDown}
          >
            {/* Base ring */}
            <div 
              className="absolute rounded-full"
              style={{
                inset: 0,
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            />

            {/* Slip mat */}
            <div 
              className="absolute rounded-full"
              style={{
                inset: 8,
                background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Vinyl record */}
            <div 
              className="absolute rounded-full overflow-hidden"
              style={{
                inset: 20,
                transform: `rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s linear',
                background: '#111',
              }}
            >
              {/* Vinyl grooves */}
              {[40, 60, 80, 100, 120].map(r => (
                <div key={r} className="absolute rounded-full border border-white/[0.02]" 
                  style={{ inset: r }} 
                />
              ))}

              {/* Label */}
              <div 
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  inset: 30,
                  background: accentColor,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-black" />
              </div>

              {/* Position indicator */}
              <div 
                className="absolute"
                style={{
                  left: '50%',
                  top: 10,
                  width: 2,
                  height: 20,
                  background: '#fff',
                  transform: 'translateX(-1px)',
                }}
              />
            </div>

            {/* Center spindle */}
            <div 
              className="absolute rounded-full bg-zinc-300"
              style={{
                left: '50%',
                top: '50%',
                width: 8,
                height: 8,
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Speed indicator LED ring */}
            <div className="absolute inset-2 rounded-full border-2 border-zinc-800 pointer-events-none" />
          </div>

          {/* Tonearm assembly */}
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            {/* Tonearm rest */}
            <div 
              className="w-16 h-3 bg-zinc-700 rounded-full cursor-pointer hover:bg-zinc-600 transition-colors"
              onClick={() => setTonearmPosition(0)}
            />
            
            {/* Tonearm */}
            <div 
              className="relative"
              style={{ height: 120 }}
            >
              {/* Arm pivot */}
              <div 
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-zinc-600 border-2 border-zinc-500"
                style={{ transform: `translateY(${tonearmPosition * 0.3}px)` }}
              >
                {/* Arm */}
                <div 
                  className="absolute w-32 h-1 bg-zinc-400 rounded-full"
                  style={{
                    right: '100%',
                    top: '50%',
                    transformOrigin: 'right center',
                    transform: `rotate(${-30 + tonearmPosition * 0.3}deg)`,
                  }}
                >
                  {/* Headshell */}
                  <div 
                    className="absolute left-0 top-1/2 w-4 h-6 bg-zinc-500 rounded"
                    style={{ transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              {/* Cue/Play button */}
              <button
                className={`absolute -right-2 top-16 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  tonearmPosition > 50 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500'
                }`}
                onClick={handleTonearmClick}
              >
                {tonearmPosition > 50 ? 'PLAY' : 'CUE'}
              </button>
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div className="w-32 flex flex-col gap-2">
          {/* Start/Stop */}
          <button
            className={`h-12 rounded-lg font-bold text-sm transition-colors ${
              playing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            onClick={playing ? onPause : onPlay}
          >
            {playing ? '■ STOP' : '▶ START'}
          </button>

          {/* Pitch fader */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>+8%</span>
              <span>PITCH</span>
              <span>-8%</span>
            </div>
            <input
              type="range"
              min="-8"
              max="8"
              step="0.1"
              value={pitch}
              onChange={handlePitchChange}
              className="flex-1 -rotate-0 vertical-slider accent-zinc-500"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
              }}
            />
            <div className="text-center text-sm font-mono text-zinc-300">
              {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%
            </div>
          </div>

          {/* BPM Display */}
          <div className="bg-black rounded p-2 text-center">
            <div className="text-xl font-mono text-zinc-300">{bpm.toFixed(2)}</div>
            <div className="text-xs text-zinc-500">BPM</div>
          </div>

          {/* Key & Time */}
          <div className="flex justify-between text-sm">
            <div className="bg-black rounded px-2 py-1">
              <span className="text-green-400 font-mono">{musicalKey}</span>
            </div>
            <div className="bg-black rounded px-2 py-1">
              <span className="text-zinc-400 font-mono">{timeRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slip mode indicator */}
      {slipMode && (
        <div className="absolute bottom-4 left-4 px-2 py-1 bg-yellow-900/80 text-yellow-400 text-xs rounded">
          SLIP MODE
        </div>
      )}
    </div>
  );
};

export default Turntable;
