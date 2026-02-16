'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Clock, Radio, Mic2, Music, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

type SegmentType = 'music' | 'ai-host' | 'ad-break' | 'jingle' | 'news' | 'live' | 'empty';

interface ScheduleSegment {
    id: string;
    type: SegmentType;
    title: string;
    startTime: string; // HH:MM
    duration: number; // minutes
    notes?: string;
}

interface DegenScheduleTimelineProps {
    segments?: ScheduleSegment[];
    currentTime?: string; // HH:MM format
    className?: string;
}

const DEMO_SEGMENTS: ScheduleSegment[] = [
    { id: '1', type: 'jingle', title: 'DGN-DJ Station ID', startTime: '14:00', duration: 1 },
    { id: '2', type: 'music', title: 'Auto-Mix: Deep House Set', startTime: '14:01', duration: 28 },
    { id: '3', type: 'ai-host', title: 'AI Host: Music Commentary', startTime: '14:29', duration: 3 },
    { id: '4', type: 'ad-break', title: 'Ad Block #1 (3 spots)', startTime: '14:32', duration: 3 },
    { id: '5', type: 'music', title: 'Auto-Mix: Techno Energy', startTime: '14:35', duration: 20 },
    { id: '6', type: 'ai-host', title: 'AI Host: Track Intro', startTime: '14:55', duration: 2 },
    { id: '7', type: 'jingle', title: 'DGN-DJ Station ID', startTime: '14:57', duration: 1 },
    { id: '8', type: 'news', title: 'AI News Wire: Headlines', startTime: '14:58', duration: 2 },
    { id: '9', type: 'music', title: 'Request Block', startTime: '15:00', duration: 25 },
    { id: '10', type: 'ad-break', title: 'Ad Block #2 (2 spots)', startTime: '15:25', duration: 2 },
    { id: '11', type: 'ai-host', title: 'AI Host: Show Outro', startTime: '15:27', duration: 3 },
    { id: '12', type: 'music', title: 'Auto-Mix: Chill Evening', startTime: '15:30', duration: 30 },
];

const SEGMENT_CONFIG: Record<SegmentType, { label: string; color: string; icon: React.ElementType; bgClass: string }> = {
    'music': { label: 'Music', color: '#aaff00', icon: Music, bgClass: 'bg-lime-500/15 border-lime-500/30' },
    'ai-host': { label: 'AI Host', color: '#bf00ff', icon: Mic2, bgClass: 'bg-purple-500/15 border-purple-500/30' },
    'ad-break': { label: 'Ads', color: '#ff6b00', icon: Zap, bgClass: 'bg-orange-500/15 border-orange-500/30' },
    'jingle': { label: 'ID', color: '#00d4ff', icon: Radio, bgClass: 'bg-cyan-500/15 border-cyan-500/30' },
    'news': { label: 'News', color: '#3b82f6', icon: Radio, bgClass: 'bg-blue-500/15 border-blue-500/30' },
    'live': { label: 'Live', color: '#ef4444', icon: Mic2, bgClass: 'bg-red-500/15 border-red-500/30' },
    'empty': { label: 'Empty', color: '#52525b', icon: Clock, bgClass: 'bg-zinc-700/15 border-zinc-700/30' },
};

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function formatHour(hour: number): string {
    const h = hour % 24;
    return `${h.toString().padStart(2, '0')}:00`;
}

export function DegenScheduleTimeline({
    segments = DEMO_SEGMENTS,
    currentTime = '14:35',
    className,
}: DegenScheduleTimelineProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const currentMinutes = timeToMinutes(currentTime);

    // Find the range of hours to display
    const startHour = useMemo(() => {
        if (segments.length === 0) return Math.floor(currentMinutes / 60);
        const firstMin = timeToMinutes(segments[0].startTime);
        return Math.floor(firstMin / 60);
    }, [segments, currentMinutes]);

    const totalHours = 2; // Show 2 hours
    const startMin = startHour * 60;
    const endMin = startMin + totalHours * 60;
    const totalMinutes = totalHours * 60;

    const currentNowPosition = ((currentMinutes - startMin) / totalMinutes) * 100;

    const selectedSegment = segments.find((s) => s.id === selectedId);

    return (
        <div className={cn('bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-lime-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        Schedule Timeline
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                        <ChevronLeft size={12} />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-400">
                        {formatHour(startHour)} – {formatHour(startHour + totalHours)}
                    </span>
                    <button className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Now indicator label */}
            <div className="px-3 py-1 flex items-center gap-1.5 bg-zinc-900/50 border-b border-zinc-800/30">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-mono text-zinc-400">
                    NOW: <span className="text-white font-bold">{currentTime}</span>
                </span>
            </div>

            {/* Timeline visualization */}
            <div className="relative px-3 py-3">
                {/* Hour markers */}
                <div className="relative h-4 mb-1">
                    {Array.from({ length: totalHours + 1 }).map((_, i) => {
                        const pos = (i / totalHours) * 100;
                        return (
                            <div
                                key={i}
                                className="absolute top-0 flex flex-col items-center"
                                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                            >
                                <span className="text-[8px] font-mono text-zinc-600">
                                    {formatHour(startHour + i)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Segment blocks */}
                <div className="relative h-12 bg-zinc-900/50 rounded border border-zinc-800/50">
                    {/* Grid lines */}
                    {Array.from({ length: totalHours * 4 }).map((_, i) => {
                        const pos = ((i + 1) / (totalHours * 4)) * 100;
                        return (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 w-[1px] bg-zinc-800/30"
                                style={{ left: `${pos}%` }}
                            />
                        );
                    })}

                    {/* Segments */}
                    {segments.map((seg) => {
                        const segStart = timeToMinutes(seg.startTime);
                        const left = ((segStart - startMin) / totalMinutes) * 100;
                        const width = (seg.duration / totalMinutes) * 100;
                        const config = SEGMENT_CONFIG[seg.type];
                        const Icon = config.icon;
                        const isActive = currentMinutes >= segStart && currentMinutes < segStart + seg.duration;
                        if (left + width < 0 || left > 100) return null;

                        return (
                            <div
                                key={seg.id}
                                onClick={() => setSelectedId(seg.id === selectedId ? null : seg.id)}
                                className={cn(
                                    'absolute top-1 bottom-1 rounded-sm border cursor-pointer transition-all',
                                    config.bgClass,
                                    isActive && 'ring-1 ring-white/30',
                                    selectedId === seg.id && 'ring-1 ring-lime-500/50 scale-y-110'
                                )}
                                style={{
                                    left: `${Math.max(0, left)}%`,
                                    width: `${Math.min(width, 100 - Math.max(0, left))}%`,
                                }}
                                title={`${seg.title} (${seg.startTime}, ${seg.duration}min)`}
                            >
                                <div className="flex items-center gap-0.5 px-1 h-full overflow-hidden">
                                    <Icon size={8} style={{ color: config.color }} className="shrink-0" />
                                    {width > 5 && (
                                        <span
                                            className="text-[7px] font-bold uppercase truncate"
                                            style={{ color: config.color }}
                                        >
                                            {seg.title}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Now marker */}
                    {currentNowPosition >= 0 && currentNowPosition <= 100 && (
                        <div
                            className="absolute top-0 bottom-0 z-10"
                            style={{ left: `${currentNowPosition}%` }}
                        >
                            <div className="w-[2px] h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-red-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Legend & segment info */}
            <div className="px-3 pb-2 flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {(Object.entries(SEGMENT_CONFIG) as [SegmentType, typeof SEGMENT_CONFIG[SegmentType]][])
                        .filter(([type]) => type !== 'empty')
                        .map(([type, config]) => (
                            <div key={type} className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                                <span className="text-[7px] uppercase tracking-wider text-zinc-600">{config.label}</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Selected segment detail */}
            {selectedSegment && (
                <div className="px-3 pb-2 border-t border-zinc-800/30 pt-2">
                    <div className="flex items-center gap-2">
                        {(() => {
                            const config = SEGMENT_CONFIG[selectedSegment.type];
                            const Icon = config.icon;
                            return <Icon size={12} style={{ color: config.color }} />;
                        })()}
                        <div>
                            <div className="text-[11px] font-bold text-white">{selectedSegment.title}</div>
                            <div className="text-[9px] text-zinc-500">
                                {selectedSegment.startTime} · {selectedSegment.duration}min
                                {selectedSegment.notes && ` · ${selectedSegment.notes}`}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
