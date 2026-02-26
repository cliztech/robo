'use client';

import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

interface DegenVUMeterProps {
    level?: number;          // 0-1
    peak?: number;           // 0-1
    orientation?: 'vertical' | 'horizontal';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showDb?: boolean;
    label?: string;
    className?: string;
}

export function DegenVUMeter({
    level = 0,
    peak = 0,
    orientation = 'vertical',
    size = 'sm',
    showDb = false,
    label,
    className,
}: DegenVUMeterProps) {
    const isVert = orientation === 'vertical';
    const segments = isVert ? 28 : 36;

    const sizeMap = {
        xs: isVert ? 'w-2' : 'h-1.5',
        sm: isVert ? 'w-3' : 'h-2',
        md: isVert ? 'w-4' : 'h-3',
        lg: isVert ? 'w-5' : 'h-4',
    };

    const heightMap = {
        xs: isVert ? 'h-14' : '',
        sm: isVert ? 'h-20' : '',
        md: isVert ? 'h-24' : '',
        lg: isVert ? 'h-32' : '',
    };

    const dbValue = useMemo(() => {
        if (level <= 0) return '-∞';
        const db = 20 * Math.log10(level);
        return db > -0.5 ? '0.0' : db.toFixed(1);
    }, [level]);

    const activeSegments = Math.round(level * segments);
    const peakSegment = Math.round(peak * segments);

    return (
        <div className={cn('flex flex-col items-center gap-1', className)}>
            {label && (
                <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">{label}</span>
            )}
            <div
                className={cn(
                    'flex gap-[1px] rounded-sm overflow-hidden bg-black/40 p-[2px]',
                    sizeMap[size],
                    heightMap[size],
                    isVert ? 'flex-col-reverse' : 'flex-row',
                    'border border-white/[0.03]'
                )}
            >
                {Array.from({ length: segments }).map((_, i) => {
                    const isActive = i < activeSegments;
                    const isPeak = i === peakSegment - 1;
                    const ratio = i / segments;

                    // Color gradient: Sapphire -> Cyan -> Amber -> Red
                    let color: string;
                    if (ratio < 0.6) color = isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.02)';
                    else if (ratio < 0.8) color = isActive ? 'var(--color-accent-2)' : 'rgba(255,255,255,0.02)';
                    else if (ratio < 0.9) color = isActive ? 'var(--color-warning)' : 'rgba(255,255,255,0.02)';
                    else color = isActive ? 'var(--color-danger)' : 'rgba(255,255,255,0.02)';

                    return (
                        <div
                            key={i}
                            className="rounded-[0.5px] transition-colors duration-75"
                            style={{
                                flex: 1,
                                backgroundColor: isPeak ? (ratio > 0.8 ? 'var(--color-danger)' : 'var(--color-accent)') : color,
                                opacity: isPeak ? 1 : isActive ? (0.7 + ratio * 0.3) : 1,
                                boxShadow: isActive && ratio > 0.85
                                    ? `0 0 6px hsla(0, 85%, 60%, 0.4)`
                                    : isPeak
                                        ? `0 0 8px ${ratio > 0.8 ? 'hsla(0, 85%, 60%, 0.5)' : 'hsla(207, 98%, 45%, 0.5)'}`
                                        : 'none',
                                borderTop: isVert ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                borderLeft: !isVert ? '1px solid rgba(255,255,255,0.05)' : 'none'
                            }}
                        />
                    );
                })}
            </div>
            {showDb && (
                <span className={cn(
                    'text-[8px] font-mono tabular-nums',
                    parseFloat(dbValue) >= -3 ? 'text-red-400' : 'text-zinc-600'
                )}>
                    {dbValue}
                </span>
            )}
        </div>
    );
}

/* ── Stereo Pair ─────────── */
export function DegenStereoMeter({
    leftLevel = 0,
    rightLevel = 0,
    leftPeak = 0,
    rightPeak = 0,
    size = 'sm',
    showDb = false,
    className,
}: {
    leftLevel?: number;
    rightLevel?: number;
    leftPeak?: number;
    rightPeak?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showDb?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex items-end gap-[3px]', className)}>
            <div className="flex flex-col items-center">
                <span className="text-[6px] font-bold text-zinc-700 mb-0.5">L</span>
                <DegenVUMeter level={leftLevel} peak={leftPeak} size={size} showDb={showDb} />
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[6px] font-bold text-zinc-700 mb-0.5">R</span>
                <DegenVUMeter level={rightLevel} peak={rightPeak} size={size} showDb={showDb} />
            </div>
        </div>
    );
}
