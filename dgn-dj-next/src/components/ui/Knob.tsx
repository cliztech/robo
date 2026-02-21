import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface KnobProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    size?: number;
    color?: 'deck-a' | 'deck-b' | 'neutral';
    label?: string;
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
    className,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number>(0);
    const startValue = useRef<number>(0);

    // Normalize value to 0-1 range for rotation
    const range = max - min;
    const normalizedValue = (value - min) / range;
    // Rotation range: -135deg to +135deg (270deg total)
    const rotation = normalizedValue * 270 - 135;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startValue.current = value;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startY.current - e.clientY;
            const sensitivity = 0.5; // Value change per pixel
            let newValue = startValue.current + deltaY * sensitivity;
            newValue = Math.max(min, Math.min(max, newValue));
            onChange(newValue);
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
    }, [isDragging, min, max, onChange]);

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
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#111"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        strokeLinecap="round"
                        className="transform -rotate-[225deg] origin-center shadow-inner"
                    />
                    {/* Shadow Ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="2"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        strokeLinecap="round"
                        className="transform -rotate-[225deg] origin-center blur-[1px]"
                    />
                    {/* Value Arc (The Glow) */}
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (normalizedValue * 188.4)}
                        strokeLinecap="round"
                        className={cn("transform -rotate-[225deg] origin-center transition-all duration-75 drop-shadow-[0_0_5px_currentColor]", colorClass)}
                    />
                </svg>

                {/* Main Knob Body (Metallic) */}
                <div
                    className={cn(
                        "absolute inset-[8%] rounded-full transition-transform duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                        isDragging ? "scale-95" : "scale-100 group-hover:scale-[1.02]"
                    )}
                    style={{
                        background: `
                            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            conic-gradient(
                                from 0deg,
                                #222 0%,
                                #333 10%,
                                #222 20%,
                                #444 30%,
                                #222 45%,
                                #333 55%,
                                #222 70%,
                                #444 85%,
                                #222 100%
                            )
                        `,
                        transform: `rotate(${rotation}deg)`
                    }}
                >
                    {/* Pointer Notch */}
                    <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[12%] h-[20%] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] z-10"></div>

                    {/* Top Surface Texture */}
                    <div className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle_at_center,#333_0%,#1a1a1a_100%)] border border-white/5 overflow-hidden">
                        {/* Anisotropic highlights */}
                        <div className="absolute inset-0 opacity-30 bg-[conic-gradient(from_0deg,transparent_0%,white_10%,transparent_20%,transparent_50%,white_60%,transparent_70%)] blur-[2px]"></div>
                    </div>
                </div>

                {/* Outer Rim Light */}
                <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none"></div>
            </div>
            {label && <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider select-none group-hover:text-zinc-300 transition-colors text-center">{label}</span>}
        </div>
    );
};
