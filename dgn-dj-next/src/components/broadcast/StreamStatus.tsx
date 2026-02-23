import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   StreamStatus — Broadcast Connection Monitor
   Inspired by: VirtualDJ's top-bar density + pro broadcast tools
   Agent: Stream Reliability Agent (Team 10c)
   ───────────────────────────────────────────────────────────── */

type ConnectionState = 'live' | 'connecting' | 'idle' | 'error' | 'reconnecting';

interface StreamStatusProps {
    className?: string;
}

const STATUS_CONFIG: Record<ConnectionState, { color: string; label: string; bg: string }> = {
    live: { color: '#2ECC71', label: 'ON AIR', bg: 'rgba(46, 204, 113, 0.12)' },
    connecting: { color: '#F1C40F', label: 'CONNECTING', bg: 'rgba(241, 196, 15, 0.12)' },
    idle: { color: '#6B7280', label: 'STANDBY', bg: 'rgba(107, 114, 128, 0.08)' },
    error: { color: '#E54848', label: 'ERROR', bg: 'rgba(229, 72, 72, 0.12)' },
    reconnecting: { color: '#E67E22', label: 'RECONNECTING', bg: 'rgba(230, 126, 34, 0.12)' },
};

export default function StreamStatus({ className = '' }: StreamStatusProps) {
    const [state] = useState<ConnectionState>('live');
    const [uptime, setUptime] = useState(0);
    const uptimeRef = useRef(0);
    const cfg = STATUS_CONFIG[state];

    // Simulated uptime counter
    useEffect(() => {
        uptimeRef.current = 3723; // 1h 2m 3s simulated start
        setUptime(uptimeRef.current);
        const iv = setInterval(() => {
            uptimeRef.current += 1;
            setUptime(uptimeRef.current);
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const bitrate = 320;
    const format = 'AAC';
    const sampleRate = '48k';
    const server = 'icecast.dgn.radio:8000';
    const mount = '/live';

    return (
        <div className={`bg-panel-2/60 rounded-md border border-white/5 ${className}`}
            style={{ backdropFilter: 'blur(8px)' }}>
            {/* ── Header row: status dot + label + uptime ── */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
                {/* Pulsing status dot — VirtualDJ style */}
                <div className="relative shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${state === 'live' ? 'animate-live-dot' : ''}`}
                        style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }} />
                    {state === 'live' && (
                        <div className="absolute inset-0 rounded-full animate-ping"
                            style={{ background: cfg.color, opacity: 0.3 }} />
                    )}
                </div>

                {/* Status badge */}
                <span className="stream-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                </span>

                {/* Uptime */}
                <span className="ml-auto font-mono text-[11px] text-white/70 tabular-nums tracking-wide">
                    {formatTime(uptime)}
                </span>
            </div>

            {/* ── Detail row: server, bitrate, format ── */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 flex-wrap">
                {/* Server endpoint */}
                <span className="font-mono text-[9px] text-white/35 truncate max-w-30"
                    title={`${server}${mount}`}>
                    {server}{mount}
                </span>

                <span className="text-white/15 text-[8px]">│</span>

                {/* Bitrate badge */}
                <span className="stream-badge"
                    style={{
                        background: bitrate >= 256 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                        color: bitrate >= 256 ? '#2ECC71' : '#F1C40F'
                    }}>
                    {bitrate}k
                </span>

                {/* Format badge */}
                <span className="stream-badge" style={{ background: 'rgba(0, 191, 216, 0.12)', color: '#00BFD8' }}>
                    {format}
                </span>

                {/* Sample rate */}
                <span className="stream-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                    {sampleRate}
                </span>

                {/* Channel indicator */}
                <span className="ml-auto text-[9px] font-mono text-white/30">STEREO</span>
            </div>

            {/* ── Audio level mini-meter ── */}
            <div className="px-3 pb-1.5 flex items-center gap-1.5">
                <span className="text-[8px] text-white/25 font-mono w-3">L</span>
                <div className="flex-1 h-0.75 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-75"
                        style={{
                            width: '72%',
                            background: 'linear-gradient(90deg, #2ECC71 0%, #2ECC71 70%, #F1C40F 85%, #E54848 100%)',
                        }} />
                </div>
                <span className="text-[8px] text-white/25 font-mono w-3">R</span>
                <div className="flex-1 h-0.75 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-75"
                        style={{
                            width: '68%',
                            background: 'linear-gradient(90deg, #2ECC71 0%, #2ECC71 70%, #F1C40F 85%, #E54848 100%)',
                        }} />
                </div>
                <span className="font-mono text-[8px] text-white/30 w-8 text-right tabular-nums">-3.2dB</span>
            </div>
        </div>
    );
}
