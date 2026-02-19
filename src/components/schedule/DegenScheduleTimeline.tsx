'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { ScheduleSegmentData, resolveScheduleCurrentHour, resolveScheduleSegmentData } from '../../lib/degenDataAdapters';
import { Clock, Radio, Mic2, Music2, Megaphone, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';

interface DegenScheduleTimelineProps {
    segments?: ScheduleSegmentData[];
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

export function DegenScheduleTimeline({
    segments,
    currentHour,
    className,
}: DegenScheduleTimelineProps) {
    const scheduleSegments = useMemo(() => resolveScheduleSegmentData(segments), [segments]);
    const activeHour = resolveScheduleCurrentHour(currentHour);
    const [viewStart, setViewStart] = useState(6);
    const [selectedSegment, setSelectedSegment] = useState<ScheduleSegmentData | null>(null);
    const viewHours = 12;
    const viewEnd = viewStart + viewHours;
    const hourWidth = 100 / viewHours;

    const visibleSegments = useMemo(
        () => scheduleSegments.filter((s) => {
            const end = s.startHour + s.durationMinutes / 60;
            return end > viewStart && s.startHour < viewEnd;
        }),
        [scheduleSegments, viewStart, viewEnd]
    );

    const formatHour = (h: number) => {
        const hour = Math.floor(h) % 24;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${display}${ampm}`;
    };

    const nowPercent = ((activeHour - viewStart) / viewHours) * 100;
    const showNow = activeHour >= viewStart && activeHour <= viewEnd;

    const selectSegmentByOffset = useCallback(
        (segmentId: string, offset: number) => {
            const segmentIndex = visibleSegments.findIndex((segment) => segment.id === segmentId);
            if (segmentIndex === -1) return;

            const target = visibleSegments[segmentIndex + offset];
            if (target) {
                setSelectedSegment(target);
            }
        },
        [visibleSegments]
    );

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
            <div className="relative flex-1 min-h-[200px] overflow-hidden">
                {/* Hour columns */}
                <div className="absolute inset-0 flex">
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
                    {visibleSegments.map((seg) => {
                        const cfg = TYPE_CONFIG[seg.type];
                        const Icon = cfg.icon;
                        const left = Math.max(0, ((seg.startHour - viewStart) / viewHours) * 100);
                        const width = Math.min(
                            100 - left,
                            (seg.durationMinutes / 60 / viewHours) * 100
                        );
                        const isActive = activeHour >= seg.startHour && activeHour < seg.startHour + seg.durationMinutes / 60;
                        const isSelected = selectedSegment?.id === seg.id;

                        return (
                            <button
                                key={seg.id}
                                type="button"
                                className={cn(
                                    'absolute rounded-md cursor-pointer transition-all duration-150 group/seg border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black',
                                    isActive && 'ring-1',
                                    isSelected && 'ring-1'
                                )}
                                style={{
                                    left: `${left}%`,
                                    width: `${Math.max(width, 1.5)}%`,
                                    top: '4px',
                                    bottom: '4px',
                                    backgroundColor: cfg.bg,
                                    borderColor: `${cfg.color}15`,
                                    boxShadow: isActive ? `0 0 12px ${cfg.color}15, inset 0 1px 0 ${cfg.color}08` : `inset 0 1px 0 ${cfg.color}05`,
                                    ...(isActive ? { ringColor: `${cfg.color}40` } : {}),
                                    ...(isSelected ? { ringColor: cfg.color } : {}),
                                }}
                                onClick={() => setSelectedSegment(seg)}
                                onKeyDown={(event) => {
                                    if (event.key === 'ArrowRight') {
                                        event.preventDefault();
                                        selectSegmentByOffset(seg.id, 1);
                                    }

                                    if (event.key === 'ArrowLeft') {
                                        event.preventDefault();
                                        selectSegmentByOffset(seg.id, -1);
                                    }
                                }}
                                aria-label={`${seg.title}, ${cfg.label}, starts ${formatHour(seg.startHour)}, duration ${seg.durationMinutes} minutes`}
                                aria-pressed={isSelected}
                            >
                                {/* Glow bar at top */}
                                <div
                                    className="absolute top-0 inset-x-0 h-[2px]"
                                    style={{ backgroundColor: cfg.color, opacity: isActive ? 0.6 : 0.2 }}
                                />
                                <div className="flex items-center gap-1.5 px-2 py-1.5 h-full">
                                    <Icon size={10} style={{ color: cfg.color }} className="shrink-0 opacity-70" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[9px] font-bold text-zinc-300 truncate leading-tight">
                                            {seg.title}
                                        </div>
                                        {seg.description && width > 6 && (
                                            <div className="text-[8px] text-zinc-600 truncate">
                                                {seg.description}
                                            </div>
                                        )}
                                    </div>
                                    {width > 4 && (
                                        <span className="text-[8px] font-mono text-zinc-600 shrink-0">
                                            {seg.durationMinutes}m
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
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
