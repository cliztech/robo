import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface KnobProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    size?: number;
    color?: 'deck-a' | 'deck-b' | 'neutral';
    label?: string;
    hasDetent?: boolean;
    className?: string;
}

export const Knob: React.FC<KnobProps> = ({
    value,
    min = 0,
    max = 100,
    onChange,
    size = 64,
    color = 'neutral',
    label,
    hasDetent = false,
    className,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showLedRing, setShowLedRing] = useState(false);
    const startY = useRef<number>(0);
    const startValue = useRef<number>(0);
    const ledTimeout = useRef<ReturnType<typeof setTimeout>>();

    const range = max - min;
    const normalizedValue = (value - min) / range;
    // 300° rotation arc (spec): -150 to +150
    const rotation = normalizedValue * 300 - 150;
    // Arc length for 300° out of 360°
    const circumference = 2 * Math.PI * 42;
    const arcLength = circumference * (300 / 360);
    const filledArc = normalizedValue * arcLength;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setShowLedRing(true);
        startY.current = e.clientY;
        startValue.current = value;
        if (ledTimeout.current) clearTimeout(ledTimeout.current);
    };

    // LED ring: show during interaction, fade after 1.5s
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        ledTimeout.current = setTimeout(() => setShowLedRing(false), 1500);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startY.current - e.clientY;
            const sensitivity = 0.5;
            let newValue = startValue.current + deltaY * sensitivity;

            // Detent snap: ±2° tolerance around center
            if (hasDetent) {
                const center = (min + max) / 2;
                const detentRange = range * (2 / 300); // 2° tolerance
                if (Math.abs(newValue - center) < detentRange) {
                    newValue = center;
                }
            }

            newValue = Math.max(min, Math.min(max, newValue));
            onChange(newValue);
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
    }, [isDragging, min, max, range, hasDetent, onChange, handleMouseUp]);

    const colorClass = {
        'deck-a': 'text-deck-a',
        'deck-b': 'text-deck-b',
        'neutral': 'text-white',
    }[color];

    const colorGlow = {
        'deck-a': 'rgba(0,145,255,0.6)',
        'deck-b': 'rgba(255,85,0,0.6)',
        'neutral': 'rgba(255,255,255,0.4)',
    }[color];

    return (
        <div className={cn("flex flex-col items-center gap-1.5", className)}>
            <div
                className="relative cursor-ns-resize group"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
            >
                {/* Glow Backdrop */}
                <div
                    className="absolute inset-[-10%] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundColor: colorGlow }}
                />

                {/* Background Ring (Deep Groove) */}
                <svg width={size} height={size} viewBox="0 0 100 100" className="transform rotate-90 scale-[1.05]">
                    <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="#111"
                        strokeWidth="10"
                        strokeDasharray={`${arcLength}`}
                        strokeDashoffset={circumference - arcLength}
                        strokeLinecap="round"
                        className="transform -rotate-[210deg] origin-center"
                    />

                    {/* LED Value Arc — visible only during/after interaction */}
                    <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={`${filledArc} ${circumference}`}
                        strokeLinecap="round"
                        className={cn(
                            "transform -rotate-[210deg] origin-center drop-shadow-[0_0_5px_currentColor]",
                            colorClass,
                            "transition-opacity duration-300",
                            showLedRing ? "opacity-100" : "opacity-30"
                        )}
                    />
                </svg>

                {/* Main Knob Body — matte rubber material */}
                <div
                    className={cn(
                        "absolute inset-[8%] rounded-full bg-matte-rubber noise-grain",
                        isDragging ? "scale-95" : "scale-100 group-hover:scale-[1.02]"
                    )}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        /* Spec easing: cubic-bezier(0.22, 0.61, 0.36, 1) */
                        transition: isDragging
                            ? 'transform 0ms, scale 200ms cubic-bezier(0.22,0.61,0.36,1)'
                            : 'transform 100ms cubic-bezier(0.22,0.61,0.36,1), scale 200ms ease-out',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
                    }}
                >
                    {/* Pointer Notch */}
                    <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[12%] h-[20%] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] z-10" />

                    {/* Detent marker */}
                    {hasDetent && (
                        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[6%] h-[4%] rounded-full bg-white/20" />
                    )}
                </div>

                {/* Outer Rim Light */}
                <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
            </div>
            {label && (
                <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-micro select-none group-hover:text-zinc-300 transition-colors text-center">
                    {label}
                </span>
            )}
        </div>
    );
};
