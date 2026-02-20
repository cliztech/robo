import React, { useState, useEffect, useRef } from 'react';
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

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateValueFromMouse(e.clientY);
        document.body.style.cursor = 'ns-resize';
    };

    const updateValueFromMouse = (clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        // Calculate percentage from bottom (100% at top, 0% at bottom)
        const relativeY = rect.bottom - clientY;
        let newPercentage = relativeY / rect.height;
        newPercentage = Math.max(0, Math.min(1, newPercentage));

        const newValue = min + newPercentage * range;
        onChange(newValue);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            updateValueFromMouse(e.clientY);
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
        'deck-a': 'bg-deck-a shadow-[0_0_10px_rgba(0,145,255,0.5)]',
        'deck-b': 'bg-deck-b shadow-[0_0_10px_rgba(255,85,0,0.5)]',
        'neutral': 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]',
    }[color];

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div
                className="relative w-12 bg-[#0E0E0E] rounded-md border border-[#222] shadow-inner flex justify-center py-2 cursor-ns-resize"
                style={{ height }}
                onMouseDown={handleMouseDown}
                ref={trackRef}
            >
                {/* Track Line */}
                <div className="absolute top-4 bottom-4 w-[2px] bg-[#333]"></div>

                {/* Fader Cap */}
                <div
                    className="absolute w-8 h-12 bg-[#1a1a1a] border border-[#444] rounded flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    style={{ bottom: `calc(${percentage}% - 24px)` }} // Center cap
                >
                    <div className="w-full h-[1px] bg-[#666]"></div>
                    <div className={cn("absolute w-6 h-[2px]", colorClass)}></div>
                </div>
            </div>
            {label && <span className="text-[10px] font-mono uppercase text-gray-400 select-none">{label}</span>}
        </div>
    );
};
