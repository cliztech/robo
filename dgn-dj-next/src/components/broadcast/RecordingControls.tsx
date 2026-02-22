import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   RecordingControls — Session Recording & Archive
   Agent: Stream Reliability Agent (Team 10c)
   ───────────────────────────────────────────────────────────── */

interface RecordingControlsProps {
    className?: string;
}

const FORMATS = ['WAV', 'FLAC', 'MP3 320k'] as const;

export default function RecordingControls({ className = '' }: RecordingControlsProps) {
    const [isRecording, setIsRecording] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [formatIdx, setFormatIdx] = useState(2);
    const [autoSplit, setAutoSplit] = useState(true);
    const elapsedRef = useRef(0);

    // Simulated recording timer
    useEffect(() => {
        if (!isRecording) return;
        elapsedRef.current = 2547; // start at ~42 min
        setElapsed(elapsedRef.current);
        const iv = setInterval(() => {
            elapsedRef.current += 1;
            setElapsed(elapsedRef.current);
        }, 1000);
        return () => clearInterval(iv);
    }, [isRecording]);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    // Estimate file size (very rough)
    const estimateSize = () => {
        const fmt = FORMATS[formatIdx];
        const kbps = fmt === 'WAV' ? 1411 : fmt === 'FLAC' ? 700 : 320;
        const mb = (kbps * elapsed) / 8 / 1024;
        return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
    };

    return (
        <div className={`bg-panel-2/60 rounded-md border border-white/5 ${className}`}
            style={{ backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-2 px-3 py-1.5">
                {/* ── Record button ── */}
                <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center 
            transition-all cursor-pointer border-0 shrink-0
            ${isRecording ? 'animate-rec-pulse' : 'hover:brightness-125'}`}
                    style={{
                        background: isRecording ? '#E54848' : 'rgba(229, 72, 72, 0.2)',
                        boxShadow: isRecording ? '0 0 12px rgba(229, 72, 72, 0.5)' : 'none',
                    }}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    {isRecording ? (
                        <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                    ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    )}
                </button>

                {/* ── Timer ── */}
                <div className="flex flex-col">
                    <span className={`font-mono text-[13px] tabular-nums leading-tight ${isRecording ? 'text-red-400' : 'text-white/40'
                        }`}>
                        {formatTime(elapsed)}
                    </span>
                    <span className="font-mono text-[8px] text-white/25">
                        {isRecording ? `≈ ${estimateSize()}` : 'STOPPED'}
                    </span>
                </div>

                {/* ── Spacer ── */}
                <div className="flex-1" />

                {/* ── Format selector ── */}
                <button
                    onClick={() => setFormatIdx((formatIdx + 1) % FORMATS.length)}
                    className="stream-badge cursor-pointer border-0 hover:brightness-125 transition-all"
                    style={{ background: 'rgba(0, 191, 216, 0.12)', color: '#00BFD8' }}
                >
                    {FORMATS[formatIdx]}
                </button>

                {/* ── Auto-split toggle ── */}
                <button
                    onClick={() => setAutoSplit(!autoSplit)}
                    className="stream-badge cursor-pointer border-0 hover:brightness-125 transition-all"
                    style={{
                        background: autoSplit ? 'rgba(46, 204, 113, 0.12)' : 'rgba(255,255,255,0.05)',
                        color: autoSplit ? '#2ECC71' : 'rgba(255,255,255,0.35)',
                    }}
                    title="Auto-split recordings per track"
                >
                    ✂ SPLIT
                </button>
            </div>
        </div>
    );
}
