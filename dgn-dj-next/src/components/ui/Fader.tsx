import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface FaderProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    height?: number;
    color?: 'deck-a' | 'deck-b' | 'neutral';
    label?: string;
    className?: string;
}

export const Fader: React.FC<FaderProps> = ({
    value,
    min = 0,
    max = 100,
    onChange,
    height = 200,
    color = 'neutral',
    label,
    className,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const range = max - min;
    const normalizedValue = (value - min) / range; // 0 to 1
    const percentage = normalizedValue * 100;

    const updateValueFromMouse = useCallback((clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        // Calculate percentage from bottom (100% at top, 0% at bottom)
        const relativeY = rect.bottom - clientY;
        let newPercentage = relativeY / rect.height;
        newPercentage = Math.max(0, Math.min(1, newPercentage));

        const newValue = min + newPercentage * range;
        onChange(newValue);
    }, [min, range, onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateValueFromMouse(e.clientY);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            updateValueFromMouse(e.clientY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.body.style.cursor = 'ns-resize';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, updateValueFromMouse]);

    const colorClass = {
        'deck-a': 'bg-deck-a shadow-[0_0_10px_rgba(0,145,255,0.5)]',
        'deck-b': 'bg-deck-b shadow-[0_0_10px_rgba(255,85,0,0.5)]',
        'neutral': 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]',
    }[color];

    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            <div
                className="relative w-14 bg-[#080808] rounded-lg border border-[#1a1a1a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex justify-center py-4 cursor-ns-resize group"
                style={{ height }}
                onMouseDown={handleMouseDown}
                ref={trackRef}
            >
                {/* Scale Indicators (Tick Marks) */}
                <div className="absolute inset-y-4 left-2 flex flex-col justify-between py-1 opacity-20 group-hover:opacity-40 transition-opacity">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className={cn("w-2 h-[1px] bg-white", i % 5 === 0 ? "w-3 h-[1.5px]" : "")}></div>
                    ))}
                </div>
                <div className="absolute inset-y-4 right-2 flex flex-col justify-between py-1 opacity-20 group-hover:opacity-40 transition-opacity">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className={cn("w-2 h-[1px] bg-white", i % 5 === 0 ? "w-3 h-[1.5px]" : "")}></div>
                    ))}
                </div>

                {/* Track Groove */}
                <div className="absolute top-4 bottom-4 w-4 bg-[#050505] rounded-full border border-white/5 shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
                </div>

                {/* Fader Cap (Premium Metal) */}
                <div
                    className="absolute w-10 h-14 z-10 transition-transform active:scale-95"
                    style={{ bottom: `calc(${percentage}% - 28px)` }}
                >
                    {/* Shadow */}
                    <div className="absolute inset-0 bg-black/60 blur-md translate-y-2 rounded"></div>

                    {/* Body */}
                    <div className="absolute inset-0 bg-[#222] border border-[#444] rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
                        {/* Brushed Metal Texture */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] opacity-50"></div>
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#222_0px,#222_1px,#2a2a2a_1px,#2a2a2a_2px)] opacity-20"></div>

                        {/* Recessed Center */}
                        <div className="absolute inset-x-2 inset-y-4 bg-black/40 rounded-sm border border-black/60 shadow-inner flex items-center justify-center">
                            {/* Color Indicator Line */}
                            <div className={cn("w-full h-1 blur-[1px] opacity-80", colorClass)}></div>
                            <div className={cn("absolute w-full h-[2px]", colorClass.split(' ')[0])}></div>
                        </div>
                    </div>

                    {/* Top Lighting Reflection */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-white/10 rounded-t"></div>
                </div>
            </div>
            {label && <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider select-none group-hover:text-zinc-300 transition-colors">{label}</span>}
        </div>
    );
};
