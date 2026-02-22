import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   ScheduleTimeline — Program Schedule & Compliance Monitor
   Agent: Program Director (Team 10a) + Broadcast Compliance (Team 10b)
   ───────────────────────────────────────────────────────────── */

interface ScheduleTimelineProps {
    className?: string;
}

interface Segment {
    id: string;
    type: 'music' | 'talk' | 'ad' | 'id' | 'news' | 'jingle';
    title: string;
    artist?: string;
    duration: number; // seconds
    elapsed?: number;
    icon: string;
}

const TYPE_COLORS: Record<string, string> = {
    music: '#0091FF', talk: '#2ECC71', ad: '#F1C40F',
    id: '#9B59B6', news: '#E67E22', jingle: '#00BFD8',
};

const MOCK_SCHEDULE: Segment[] = [
    { id: '1', type: 'music', title: 'Blinding Lights', artist: 'The Weeknd', duration: 212, elapsed: 147, icon: '🎵' },
    { id: '2', type: 'jingle', title: 'DGN Station ID', duration: 8, icon: '🔊' },
    { id: '3', type: 'music', title: 'Levitating', artist: 'Dua Lipa', duration: 203, icon: '🎵' },
    { id: '4', type: 'ad', title: 'Spotify Premium', duration: 30, icon: '📢' },
    { id: '5', type: 'id', title: 'Legal Station ID', duration: 10, icon: '🆔' },
    { id: '6', type: 'music', title: 'Save Your Tears', artist: 'The Weeknd', duration: 215, icon: '🎵' },
    { id: '7', type: 'news', title: 'News Update', duration: 60, icon: '📰' },
    { id: '8', type: 'music', title: "Don't Start Now", artist: 'Dua Lipa', duration: 183, icon: '🎵' },
];

export default function ScheduleTimeline({ className = '' }: ScheduleTimelineProps) {
    const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
    const [legalTimer, setLegalTimer] = useState(842);
    const autonomyMode = 'AUTO DJ';

    // Simulate elapsed time on current segment
    useEffect(() => {
        const iv = setInterval(() => {
            setSchedule((prev: Segment[]) => {
                const next = [...prev];
                const first = next[0];
                if (first && first.elapsed !== undefined) {
                    next[0] = { ...first, elapsed: first.elapsed + 1 };
                    if (next[0].elapsed !== undefined && next[0].elapsed >= next[0].duration) {
                        next.shift();
                        const newFirst = next[0];
                        if (newFirst) next[0] = { ...newFirst, elapsed: 0 };
                    }
                }
                return next;
            });
            setLegalTimer(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    const formatDur = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    };

    const formatCountdown = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const currentSeg = schedule[0];
    const upcoming = schedule.slice(1, 6);
    const progress = currentSeg?.elapsed !== undefined
        ? (currentSeg.elapsed / currentSeg.duration) * 100 : 0;

    return (
        <div className={`bg-panel-2/60 rounded-md border border-white/5 flex flex-col ${className}`}
            style={{ backdropFilter: 'blur(8px)' }}>
            {/* ── Header: Mode + Legal ID countdown ── */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="stream-badge" style={{ background: 'rgba(0, 191, 216, 0.15)', color: '#00BFD8' }}>
                        ⚡ {autonomyMode}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">Schedule</span>
                </div>

                {/* Legal ID compliance timer */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-white/30 font-mono">LEGAL ID</span>
                    <span className={`font-mono text-[10px] tabular-nums font-semibold ${legalTimer < 120 ? 'text-meter-red' : legalTimer < 300 ? 'text-meter-yellow' : 'text-white/50'
                        }`}>
                        {formatCountdown(legalTimer)}
                    </span>
                </div>
            </div>

            {/* ── Now Playing: current segment with progress ── */}
            {currentSeg && (
                <div className="px-3 py-2 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] text-white/25 font-mono uppercase tracking-wider">NOW</span>
                        <span className="text-[10px]">{currentSeg.icon}</span>
                        <span className="stream-badge"
                            style={{ background: `${TYPE_COLORS[currentSeg.type]}18`, color: TYPE_COLORS[currentSeg.type] }}>
                            {currentSeg.type.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-white/90 font-medium truncate">
                                {currentSeg.title}
                            </div>
                            {currentSeg.artist && (
                                <div className="text-[10px] text-white/40 truncate">{currentSeg.artist}</div>
                            )}
                        </div>
                        <div className="shrink-0 text-right">
                            <span className="font-mono text-[11px] text-white/70 tabular-nums">
                                -{formatDur(currentSeg.duration - (currentSeg.elapsed || 0))}
                            </span>
                            <span className="font-mono text-[9px] text-white/30 tabular-nums ml-1">
                                / {formatDur(currentSeg.duration)}
                            </span>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-0.75 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                            style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${TYPE_COLORS[currentSeg.type]}CC, ${TYPE_COLORS[currentSeg.type]})`,
                                boxShadow: `0 0 6px ${TYPE_COLORS[currentSeg.type]}40`,
                            }} />
                    </div>
                </div>
            )}

            {/* ── Upcoming segments ── */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                {upcoming.map((seg, idx) => (
                    <div key={seg.id}
                        className={`segment-${seg.type} flex items-center gap-2 px-3 py-1.5 
                 border-b border-white/3 hover:bg-white/2 transition-colors cursor-default`}>
                        {/* Position indicator */}
                        <span className="text-[9px] text-white/20 font-mono w-3.5 text-center tabular-nums">
                            {idx + 1}
                        </span>

                        {/* Icon + type */}
                        <span className="text-[10px] shrink-0">{seg.icon}</span>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-white/70 truncate block">{seg.title}</span>
                            {seg.artist && <span className="text-[9px] text-white/30 truncate block">{seg.artist}</span>}
                        </div>

                        {/* Duration */}
                        <span className="font-mono text-[10px] text-white/35 tabular-nums shrink-0">
                            {formatDur(seg.duration)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
