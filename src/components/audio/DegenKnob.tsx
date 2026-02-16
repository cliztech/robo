'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DegenKnobProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    onChange?: (val: number) => void;
    size?: number;
}

export function DegenKnob({
    label,
    value,
    min = 0,
    max = 100,
    unit = '%',
    onChange,
    size = 60,
}: DegenKnobProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startVal = useRef(0);

    const angle = ((value - min) / (max - min)) * 270 - 135;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = value;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startY.current - e.clientY;
        const range = max - min;
        const step = range / 200; // sensitivity
        const newVal = Math.max(min, Math.min(max, startVal.current + deltaY * step));
        onChange?.(newVal);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <div
                className="relative cursor-ns-resize group"
                onMouseDown={handleMouseDown}
                style={{ width: size, height: size }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circle */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="hsl(var(--color-surface-2))"
                        stroke="hsl(var(--color-surface))"
                        strokeWidth="2"
                    />
                    {/* Value track */}
                    <path
                        d="M 25 80 A 40 40 0 1 1 75 80"
                        fill="none"
                        stroke="hsl(var(--color-bg))"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    {/* Active track */}
                    <path
                        d="M 25 80 A 40 40 0 1 1 75 80"
                        fill="none"
                        stroke="hsl(var(--color-accent))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${((value - min) / (max - min)) * 190} 1000`}
                        className="drop-shadow-[0_0_5px_rgba(170,255,0,0.5)]"
                    />
                    {/* Indicator mark */}
                    <g transform={`rotate(${angle} 50 50)`}>
                        <line
                            x1="50" y1="20" x2="50" y2="35"
                            stroke="hsl(var(--color-accent))"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    </g>
                </svg>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{label}</span>
                <span className="text-[12px] font-mono font-medium text-white">
                    {value.toFixed(1)}{unit}
                </span>
            </div>
        </div>
    );
}
