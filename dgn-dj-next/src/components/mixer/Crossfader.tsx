import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CrossfaderProps {
    value?: number;
    onChange?: (value: number) => void;
}

type CurveType = 'smooth' | 'cut' | 'constant';

export const Crossfader: React.FC<CrossfaderProps> = ({
    value: controlledValue,
    onChange,
}) => {
    const [internalValue, setInternalValue] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [curve, setCurve] = useState<CurveType>('smooth');
    const [displayValue, setDisplayValue] = useState(50);
    const trackRef = useRef<HTMLDivElement>(null);

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Motion smoothing: 100ms linear interpolation
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            setDisplayValue(prev => prev + (value - prev) * 0.3);
        });
        return () => cancelAnimationFrame(id);
    }, [value]);

    const updateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        // Center detent
        if (Math.abs(pct - 50) < 2) pct = 50;
        if (onChange) onChange(pct);
        else setInternalValue(pct);
    }, [onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateValue(e.clientX);
        const handleMove = (ev: MouseEvent) => updateValue(ev.clientX);
        const handleUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    const capLeft = `${displayValue}%`;

    const curveLabels: Record<CurveType, string> = {
        smooth: '⌒',
        cut: '╱',
        constant: '—',
    };

    return (
        <div className="flex flex-col items-center gap-1.5" style={{ width: '320px' }}>
            {/* Curve selector micro-toggle */}
            <div className="flex gap-0.5">
                {(['smooth', 'cut', 'constant'] as CurveType[]).map(c => (
                    <button
                        key={c}
                        onClick={() => setCurve(c)}
                        className={cn(
                            "w-6 h-4 text-[8px] font-mono rounded-sm transition-all",
                            curve === c
                                ? "text-white bg-white/10 border border-white/20"
                                : "text-zinc-700 hover:text-zinc-500"
                        )}
                    >
                        {curveLabels[c]}
                    </button>
                ))}
            </div>

            {/* Crossfader Track */}
            <div
                ref={trackRef}
                className="relative w-full h-8 cursor-pointer select-none"
                onMouseDown={handleMouseDown}
            >
                {/* Track rail */}
                <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-[3px] rounded-full bg-panel-2">
                    {/* LED track indicator */}
                    <div
                        className="absolute inset-y-0 rounded-full transition-all"
                        style={{
                            left: `${Math.min(displayValue, 50)}%`,
                            right: `${100 - Math.max(displayValue, 50)}%`,
                            background: displayValue < 50
                                ? 'linear-gradient(90deg, #0091FF60, #0091FF20)'
                                : displayValue > 50
                                    ? 'linear-gradient(90deg, #FF550020, #FF550060)'
                                    : 'rgba(255,255,255,0.1)',
                            boxShadow: displayValue !== 50
                                ? `0 0 6px ${displayValue < 50 ? '#0091FF30' : '#FF550030'}`
                                : 'none',
                            transition: 'all 100ms linear',
                        }}
                    />
                </div>

                {/* Center line */}
                <div className="absolute top-1 bottom-1 left-1/2 -translate-x-px w-[2px] bg-white/8 rounded" />

                {/* Cap (brushed metal) */}
                <div
                    className={cn(
                        "absolute top-0 h-full bg-brushed-metal noise-grain rounded-md border border-white/8",
                        isDragging ? "scale-y-95" : "hover:border-white/15"
                    )}
                    style={{
                        width: '48px',
                        left: capLeft,
                        transform: `translateX(-50%)${isDragging ? ' scaleY(0.95)' : ''}`,
                        transition: isDragging ? 'none' : 'left 100ms linear',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                >
                    {/* Grip lines */}
                    <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
                        <div className="h-[1px] bg-white/10 rounded" />
                        <div className="h-[1px] bg-white/15 rounded" />
                        <div className="h-[1px] bg-white/10 rounded" />
                    </div>
                </div>
            </div>

            {/* A/B Labels */}
            <div className="flex justify-between w-full px-1">
                <span className="text-xxs font-mono font-bold text-deck-a/60 tracking-micro">A</span>
                <span className="text-xxs font-mono font-bold text-deck-b/60 tracking-micro">B</span>
            </div>
        </div>
    );
};
