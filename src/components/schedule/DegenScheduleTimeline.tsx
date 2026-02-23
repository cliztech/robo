'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Clock, Radio, Mic2, Music2, Megaphone, Newspaper, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface ScheduleSegment {
    id: string;
    type: 'music' | 'ai-host' | 'ad' | 'jingle' | 'news';
    title: string;
    startHour: number;
    durationMinutes: number;
    description?: string;
}

interface DegenScheduleTimelineProps {
    segments?: ScheduleSegment[];
    currentHour?: number;
    className?: string;
}

const TYPE_CONFIG = {
    music: { icon: Music2, color: '#aaff00', bg: 'rgba(170,255,0,0.08)', label: 'Music' },
    'ai-host': { icon: Mic2, color: '#00bfff', bg: 'rgba(0,191,255,0.08)', label: 'AI Host' },
    ad: { icon: Megaphone, color: '#ff6b00', bg: 'rgba(255,107,0,0.08)', label: 'Ad Break' },
    jingle: { icon: Radio, color: '#ff33cc', bg: 'rgba(255,51,204,0.08)', label: 'Jingle' },
    news: { icon: Newspaper, color: '#ffcc00', bg: 'rgba(255,204,0,0.08)', label: 'News' },
};

const DEFAULT_SEGMENTS: ScheduleSegment[] = [
    { id: '1', type: 'music', title: 'Morning Bass Set', startHour: 6, durationMinutes: 90, description: 'Deep house mix' },
    { id: '2', type: 'ai-host', title: 'AI Morning Show', startHour: 7.5, durationMinutes: 30, description: 'AI persona intro' },
    { id: '3', type: 'jingle', title: 'Station ID', startHour: 8, durationMinutes: 5 },
    { id: '4', type: 'ad', title: 'Sponsor Block', startHour: 8.08, durationMinutes: 15 },
    { id: '5', type: 'music', title: 'Midday Vibes', startHour: 8.33, durationMinutes: 120 },
    { id: '6', type: 'news', title: 'Crypto News', startHour: 10.33, durationMinutes: 15 },
    { id: '7', type: 'ai-host', title: 'AI Commentary', startHour: 10.58, durationMinutes: 20 },
    { id: '8', type: 'music', title: 'Afternoon Mix', startHour: 10.92, durationMinutes: 180 },
    { id: '9', type: 'ad', title: 'Ad Break', startHour: 13.92, durationMinutes: 10 },
    { id: '10', type: 'jingle', title: 'Station ID', startHour: 14.08, durationMinutes: 5 },
    { id: '11', type: 'music', title: 'Evening Sessions', startHour: 14.17, durationMinutes: 240 },
    { id: '12', type: 'ai-host', title: 'Overnight AI', startHour: 18.17, durationMinutes: 120 },
];

/* ═══════════════════════════════════════════════
   TIMELINE SEGMENT (Draggable & Resizable)
   ═══════════════════════════════════════════════ */
function TimelineSegment({
    segment,
    viewStart,
    viewHours,
    containerRef,
    onUpdate,
    onResize,
    onSelect,
    isSelected,
    currentHour,
    hasConflict,
}: {
    segment: ScheduleSegment;
    viewStart: number;
    viewHours: number;
    containerRef: React.RefObject<HTMLDivElement>;
    onUpdate: (id: string, newStart: number) => void;
    onResize: (id: string, newDuration: number) => void;
    onSelect: (seg: ScheduleSegment) => void;
    isSelected: boolean;
    currentHour: number;
    hasConflict?: boolean;
}) {
    const cfg = TYPE_CONFIG[segment.type];
    const Icon = hasConflict ? Megaphone : cfg.icon;

    // Calculate initial position/width percentages
    const startPercent = Math.max(0, ((segment.startHour - viewStart) / viewHours) * 100);
    const durationPercent = (segment.durationMinutes / 60 / viewHours) * 100;
    const widthPercent = Math.min(100 - startPercent, durationPercent);
    const isActive = currentHour >= segment.startHour && currentHour < segment.startHour + segment.durationMinutes / 60;

    // Use motion value for performant dragging
    const x = useMotionValue(0);

    return (
        <motion.div
            drag="x"
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(event, info) => {
                if (!containerRef.current) return;
                const bounds = containerRef.current.getBoundingClientRect();
                const pixelDelta = info.offset.x;
                const percentDelta = (pixelDelta / bounds.width) * 100;
                const hoursDelta = (percentDelta / 100) * viewHours;

                // Snap to 15 min (0.25h)
                let newStart = segment.startHour + hoursDelta;
                newStart = Math.round(newStart * 4) / 4;

                // Clamp within reasonable day bounds (0-24)
                newStart = Math.max(0, Math.min(24 - segment.durationMinutes / 60, newStart));

                if (newStart !== segment.startHour) {
                    onUpdate(segment.id, newStart);
                }
            }}
            className={cn(
                'absolute rounded-md cursor-grab active:cursor-grabbing transition-shadow duration-150 group/seg border overflow-visible',
                isActive && 'ring-1',
                isSelected && 'ring-1 ring-white',
                hasConflict && 'border-red-500 bg-red-500/10' // Conflict styles
            )}
            style={{
                left: `${startPercent}%`,
                width: `${Math.max(widthPercent, 1.5)}%`,
                top: '4px',
                bottom: '4px',
                backgroundColor: hasConflict ? undefined : cfg.bg, // Allow override
                borderColor: hasConflict ? undefined : `${cfg.color}15`,
                boxShadow: isActive ? `0 0 12px ${cfg.color}15, inset 0 1px 0 ${cfg.color}08` : `inset 0 1px 0 ${cfg.color}05`,
                x,
                zIndex: isSelected ? 10 : 1,
                ...(isActive ? { ringColor: `${cfg.color}40` } : {}),
                ...(isSelected ? { ringColor: cfg.color } : {}),
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(segment);
            }}
            whileHover={{ scale: 1.0, zIndex: 20 }}
            whileTap={{ scale: 1.0, zIndex: 30 }}
        >
            {/* Glow bar at top */}
            <div
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{ backgroundColor: hasConflict ? '#ef4444' : cfg.color, opacity: isActive ? 0.6 : 0.2 }}
            />

            {/* Grip handle for drag affordance (Left) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 flex justify-center opacity-0 group-hover/seg:opacity-40 hover:!opacity-100 cursor-ew-resize">
                <GripVertical size={8} className="text-white" />
            </div>

            {/* Resize Handle (Right) */}
            <motion.div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/20 flex items-center justify-center z-50 group/resize"
                drag="x"
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={{ left: 0 }}
                onDragEnd={(event, info) => {
                    event.stopPropagation(); // Prevent parent drag
                    if (!containerRef.current) return;
                    const bounds = containerRef.current.getBoundingClientRect();
                    const pixelDelta = info.offset.x;
                    const percentDelta = (pixelDelta / bounds.width) * 100;
                    const minutesDelta = ((percentDelta / 100) * viewHours) * 60;

                    let newDuration = segment.durationMinutes + minutesDelta;
                    newDuration = Math.round(newDuration / 5) * 5;
                    newDuration = Math.max(5, newDuration);

                    if (newDuration !== segment.durationMinutes) {
                        onResize(segment.id, newDuration);
                    }
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-[2px] h-3 bg-white/30 rounded-full group-hover/resize:bg-white/80" />
            </motion.div>


            <div className="flex items-center gap-1.5 px-2 py-1.5 h-full pl-3 overflow-hidden">
                <Icon size={10} style={{ color: hasConflict ? '#ef4444' : cfg.color }} className="shrink-0 opacity-70" />
                <div className="min-w-0 flex-1">
                    <div className={cn("text-[9px] font-bold truncate leading-tight select-none", hasConflict ? 'text-red-200' : 'text-zinc-300')}>
                        {segment.title}
                    </div>
                    {segment.description && widthPercent > 6 && (
                        <div className={cn("text-[8px] truncate select-none", hasConflict ? 'text-red-300/70' : 'text-zinc-600')}>
                            {segment.description}
                        </div>
                    )}
                </div>
                {widthPercent > 4 && (
                    <span className={cn("text-[8px] font-mono shrink-0 select-none", hasConflict ? 'text-red-300' : 'text-zinc-600')}>
                        {segment.durationMinutes}m
                    </span>
                )}
            </div>
        </motion.div>
    );
}

export function DegenScheduleTimeline({
    segments: initialSegments = DEFAULT_SEGMENTS,
    currentHour = 9.5,
    className,
}: DegenScheduleTimelineProps) {
    const [segments, setSegments] = useState<ScheduleSegment[]>(initialSegments);
    const [viewStart, setViewStart] = useState(6);
    const [selectedSegment, setSelectedSegment] = useState<ScheduleSegment | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const viewHours = 12;
    const viewEnd = viewStart + viewHours;

    const visibleSegments = useMemo(
        () => segments.filter((s) => {
            const end = s.startHour + s.durationMinutes / 60;
            return end > viewStart && s.startHour < viewEnd;
        }),
        [segments, viewStart, viewEnd]
    );

    // Calculate conflicts
    const conflicts = useMemo(() => {
        const conflictSet = new Set<string>();
        // Simple O(N^2) check is fine for small N
        for (let i = 0; i < segments.length; i++) {
            const startA = segments[i].startHour;
            const endA = startA + segments[i].durationMinutes / 60;

            for (let j = i + 1; j < segments.length; j++) {
                const startB = segments[j].startHour;
                const endB = startB + segments[j].durationMinutes / 60;

                if (startA < endB && endA > startB) {
                    conflictSet.add(segments[i].id);
                    conflictSet.add(segments[j].id);
                }
            }
        }
        return conflictSet;
    }, [segments]);


    const handleUpdateSegment = (id: string, newStart: number) => {
        setSegments(prev => prev.map(s =>
            s.id === id ? { ...s, startHour: newStart } : s
        ));
    };

    const handleResizeSegment = (id: string, newDuration: number) => {
        setSegments(prev => prev.map(s =>
            s.id === id ? { ...s, durationMinutes: newDuration } : s
        ));
    };

    const formatHour = (h: number) => {
        const hour = Math.floor(h) % 24;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${display}${ampm}`;
    };

    const nowPercent = ((currentHour - viewStart) / viewHours) * 100;
    const showNow = currentHour >= viewStart && currentHour <= viewEnd;

    return (
        <div className={cn('glass-panel overflow-hidden flex flex-col', className)}>
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-lime-500/70" />
                    <span className="panel-header-title">Schedule Timeline</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewStart(Math.max(0, viewStart - 6))}
                        aria-label="Show earlier schedule window"
                        className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
                    >
                        <ChevronLeft size={12} />
                    </button>
                    <span className="text-[9px] font-mono text-zinc-500 w-24 text-center">
                        {formatHour(viewStart)} — {formatHour(viewEnd)}
                    </span>
                    <button
                        onClick={() => setViewStart(Math.min(18, viewStart + 6))}
                        aria-label="Show later schedule window"
                        className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
                    >
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Type legend */}
            <div className="flex gap-3 px-3 py-2 border-b border-white/[0.03]">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 4px ${cfg.color}30` }} />
                        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Timeline grid */}
            <div className="relative flex-1 min-h-[200px] overflow-hidden" ref={containerRef}>
                {/* Hour columns */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: viewHours }).map((_, i) => {
                        const hour = viewStart + i;
                        return (
                            <div
                                key={i}
                                className="flex-1 border-r border-white/[0.03] relative"
                            >
                                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-700">
                                    {formatHour(hour)}
                                </span>
                                {/* Half-hour line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.015]" />
                            </div>
                        );
                    })}
                </div>

                {/* Segments */}
                <div className="absolute inset-x-0 top-6 bottom-2 px-0">
                    {visibleSegments.map((seg) => (
                        <TimelineSegment
                            key={seg.id}
                            segment={seg}
                            viewStart={viewStart}
                            viewHours={viewHours}
                            containerRef={containerRef}
                            onUpdate={handleUpdateSegment}
                            onResize={handleResizeSegment}
                            onSelect={setSelectedSegment}
                            isSelected={selectedSegment?.id === seg.id}
                            currentHour={currentHour}
                            hasConflict={conflicts.has(seg.id)}
                        />
                    ))}
                </div>

                {/* Now indicator */}
                {showNow && (
                    <div
                        className="absolute top-0 bottom-0 z-10 pointer-events-none"
                        style={{ left: `${nowPercent}%` }}
                    >
                        <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-red-500" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.4)' }} />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500" />
                        <div className="absolute top-0 left-1/2 translate-x-1 bg-red-500/90 text-[7px] font-black text-white px-1.5 py-0.5 rounded-sm tracking-wider" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.3)' }}>
                            NOW
                        </div>
                    </div>
                )}
            </div>

            {/* Detail panel */}
            {selectedSegment && (
                <div className="px-3 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {React.createElement(TYPE_CONFIG[selectedSegment.type].icon, {
                                size: 12,
                                style: { color: TYPE_CONFIG[selectedSegment.type].color },
                            })}
                            <span className="text-[11px] font-bold text-zinc-200">{selectedSegment.title}</span>
                            <span
                                className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider"
                                style={{
                                    color: TYPE_CONFIG[selectedSegment.type].color,
                                    backgroundColor: `${TYPE_CONFIG[selectedSegment.type].color}10`,
                                }}
                            >
                                {TYPE_CONFIG[selectedSegment.type].label}
                            </span>
                            {conflicts.has(selectedSegment.id) && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                    <Megaphone size={9} /> Conflict
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                            <span>{formatHour(selectedSegment.startHour)}</span>
                            <span className="text-zinc-700">→</span>
                            <span>{formatHour(selectedSegment.startHour + selectedSegment.durationMinutes / 60)}</span>
                            <span className="text-zinc-700">({selectedSegment.durationMinutes}m)</span>
                        </div>
                    </div>
                    {selectedSegment.description && (
                        <p className="text-[10px] text-zinc-600 mt-1">{selectedSegment.description}</p>
                    )}
                </div>
            )}
        </div>
    );
}
