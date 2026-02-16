'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface DegenVUMeterProps {
    level?: number; // 0-100
    peak?: number; // 0-100
    label?: string;
    orientation?: 'vertical' | 'horizontal';
    size?: 'sm' | 'md' | 'lg';
    showDb?: boolean;
    className?: string;
}

function levelToDb(level: number): string {
    if (level <= 0) return '-∞';
    const db = 20 * Math.log10(level / 100);
    return db.toFixed(1);
}

export function DegenVUMeter({
    level = 0,
    peak = 0,
    label,
    orientation = 'vertical',
    size = 'md',
    showDb = true,
    className,
}: DegenVUMeterProps) {
    const segments = orientation === 'vertical' ? 24 : 32;
    const isVertical = orientation === 'vertical';

    const getSegmentColor = (index: number) => {
        const pos = index / segments;
        if (pos >= 0.85) return 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]';
        if (pos >= 0.7) return 'bg-yellow-500';
        return 'bg-lime-500';
    };

    const activeSegments = Math.floor((level / 100) * segments);
    const peakSegment = Math.floor((peak / 100) * segments);

    const widths = { sm: 'w-2', md: 'w-3', lg: 'w-4' };
    const heights = { sm: 'h-20', md: 'h-28', lg: 'h-40' };

    if (isVertical) {
        return (
            <div className={cn('flex flex-col items-center gap-1', className)}>
                {showDb && (
                    <span className="text-[8px] font-mono text-zinc-500 tabular-nums">
                        {levelToDb(level)}dB
                    </span>
                )}
                <div className={cn('relative flex flex-col-reverse gap-[1px]', heights[size], widths[size])}>
                    {Array.from({ length: segments }).map((_, i) => {
                        const isActive = i < activeSegments;
                        const isPeak = i === peakSegment && peak > 0;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    'w-full rounded-[1px] transition-all duration-75',
                                    isActive ? getSegmentColor(i) : 'bg-zinc-800/60',
                                    isPeak && !isActive && 'bg-white/80',
                                    size === 'sm' ? 'h-[2px]' : 'h-[3px]'
                                )}
                            />
                        );
                    })}
                </div>
                {label && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
                        {label}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {label && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 w-6 text-right">
                    {label}
                </span>
            )}
            <div className="relative flex gap-[1px] flex-1 h-2">
                {Array.from({ length: segments }).map((_, i) => {
                    const isActive = i < activeSegments;
                    const isPeak = i === peakSegment && peak > 0;
                    return (
                        <div
                            key={i}
                            className={cn(
                                'flex-1 rounded-[1px] transition-all duration-75',
                                isActive ? getSegmentColor(i) : 'bg-zinc-800/60',
                                isPeak && !isActive && 'bg-white/80'
                            )}
                        />
                    );
                })}
            </div>
            {showDb && (
                <span className="text-[8px] font-mono text-zinc-500 w-10 text-right tabular-nums">
                    {levelToDb(level)}dB
                </span>
            )}
        </div>
    );
}

/* ── Stereo Meter pair ─────────────────────────────────── */

interface DegenStereoMeterProps {
    leftLevel?: number;
    rightLevel?: number;
    leftPeak?: number;
    rightPeak?: number;
    className?: string;
}

export function DegenStereoMeter({
    leftLevel = 0,
    rightLevel = 0,
    leftPeak = 0,
    rightPeak = 0,
    className,
}: DegenStereoMeterProps) {
    return (
        <div className={cn('flex gap-1 items-end', className)}>
            <DegenVUMeter level={leftLevel} peak={leftPeak} label="L" orientation="vertical" size="md" />
            <DegenVUMeter level={rightLevel} peak={rightPeak} label="R" orientation="vertical" size="md" />
        </div>
    );
}
