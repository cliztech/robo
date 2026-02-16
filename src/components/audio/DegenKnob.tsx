'use client';

import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';

interface DegenKnobProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    onChange?: (val: number) => void;
    size?: number;
    color?: string;
}

export function DegenKnob({
    label,
    value,
    min = 0,
    max = 100,
    unit = '%',
    onChange,
    size = 60,
    color,
}: DegenKnobProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startVal = useRef(0);

    const ratio = (value - min) / (max - min);
    const angle = ratio * 270 - 135;
    const accentColor = color || 'hsl(var(--color-control-active))';

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = value;
        const handleMouseMove = (ev: MouseEvent) => {
            const deltaY = startY.current - ev.clientY;
            const range = max - min;
            const step = range / 200;
            const newVal = Math.max(min, Math.min(max, startVal.current + deltaY * step));
            onChange?.(newVal);
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // SVG arc path for the value track
    const arcRadius = 38;
    const startAngle = -225; // degrees
    const endAngle = startAngle + 270;
    const valueAngle = startAngle + ratio * 270;

    const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
        const s = polarToCartesian(cx, cy, r, start);
        const e = polarToCartesian(cx, cy, r, end);
        const largeArc = end - start > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    };

    const isSmall = size <= 30;

    return (
        <div className="flex flex-col items-center gap-0.5 select-none">
            <div
                className={cn(
                    'relative cursor-ns-resize group',
                    isDragging && 'scale-105'
                )}
                onMouseDown={handleMouseDown}
                style={{ width: size, height: size, transition: 'transform 0.1s ease' }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                        <radialGradient id={`knob-bg-${label}`} cx="40%" cy="35%" r="60%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
                        </radialGradient>
                        <filter id={`knob-shadow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.6)" />
                        </filter>
                    </defs>

                    {/* Outer ring shadow */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

                    {/* Knob body */}
                    <circle
                        cx="50" cy="50" r="40"
                        fill={`url(#knob-bg-${label})`}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="1"
                        filter={`url(#knob-shadow-${label})`}
                    />

                    {/* Inner circle */}
                    <circle cx="50" cy="50" r="32" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                    {/* Background track */}
                    <path
                        d={describeArc(50, 50, arcRadius, startAngle, endAngle)}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* Value track */}
                    {ratio > 0.005 && (
                        <path
                            d={describeArc(50, 50, arcRadius, startAngle, valueAngle)}
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            opacity={0.8}
                            style={{ filter: `drop-shadow(0 0 2px ${accentColor})` }}
                        />
                    )}

                    {/* Indicator needle */}
                    <g transform={`rotate(${angle} 50 50)`}>
                        <line
                            x1="50" y1="22" x2="50" y2="32"
                            stroke={accentColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity={0.9}
                        />
                    </g>

                    {/* Center dot */}
                    <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.08)" />
                </svg>
            </div>

            {!isSmall && (
                <div className="flex flex-col items-center mt-px">
                    <span className="text-[7px] uppercase font-black tracking-[0.15em] text-zinc-600 leading-none">
                        {label}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-zinc-400 tabular-nums leading-tight mt-0.5">
                        {value.toFixed(0)}<span className="text-zinc-600 text-[7px]">{unit}</span>
                    </span>
                </div>
            )}
        </div>
    );
}
