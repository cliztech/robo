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
        document.body.style.cursor = 'ns-resize';
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
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, onChange]);

    const colorClass = {
        'deck-a': 'text-deck-a',
        'deck-b': 'text-deck-b',
        'neutral': 'text-white',
    }[color];

    return (
        <div className={cn("flex flex-col items-center gap-1", className)}>
            <div
                className="relative cursor-ns-resize group"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
            >
                {/* Background Ring */}
                <svg width={size} height={size} viewBox="0 0 100 100" className="transform rotate-90">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#333"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8" /* 270 degrees arc */
                        strokeLinecap="round"
                        className="transform -rotate-[225deg] origin-center"
                    />
                    {/* Value Arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (normalizedValue * 188.4)} /* 188.4 is 75% of circumference */
                        strokeLinecap="round"
                        className={cn("transform -rotate-[225deg] origin-center transition-colors", colorClass)}
                    />
                </svg>

                {/* Pointer/Cap */}
                <div
                    className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div className="w-1 h-3 bg-white absolute top-2 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
                </div>

                {/* Inner Cap Reflection */}
                <div className="absolute inset-[15%] rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none border border-white/5"></div>
            </div>
            {label && <span className="text-[10px] font-mono uppercase text-gray-400 select-none">{label}</span>}
        </div>
    );
};
