import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface VUMeterProps {
    level?: number;
    className?: string;
    segments?: number;
}

export const VUMeter: React.FC<VUMeterProps> = ({
    level = 0,
    className,
    segments = 24,
}) => {
    const [displayLevel, setDisplayLevel] = useState(0);
    const [peakLevel, setPeakLevel] = useState(0);
    const peakTimer = useRef<ReturnType<typeof setTimeout>>();
    const prevTime = useRef<number>(performance.now());
    const frameRef = useRef<number>();

    useEffect(() => {
        const animate = (time: number) => {
            const dt = time - prevTime.current;
            prevTime.current = time;

            setDisplayLevel(prev => {
                if (level > prev) {
                    // Rise: 60ms to reach target
                    const riseRate = 1 / 60; // per ms
                    return Math.min(level, prev + (level - prev) * Math.min(1, dt * riseRate * 3));
                } else {
                    // Fall: 180ms to decay
                    const fallRate = 1 / 180;
                    return Math.max(level, prev - prev * Math.min(1, dt * fallRate));
                }
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [level]);

    // Peak hold: 800ms
    useEffect(() => {
        if (displayLevel > peakLevel) {
            setPeakLevel(displayLevel);
            if (peakTimer.current) clearTimeout(peakTimer.current);
            peakTimer.current = setTimeout(() => setPeakLevel(0), 800);
        }
    }, [displayLevel, peakLevel]);

    const getSegmentColor = (index: number, total: number) => {
        const pos = index / total;
        if (pos > 0.85) return '#E54848'; // Red: top 15%
        if (pos > 0.7) return '#F1C40F';  // Yellow: 70-85%
        return '#2ECC71';                   // Green: 0-70%
    };

    const activeSegments = Math.floor(displayLevel * segments);
    const peakSegment = Math.floor(peakLevel * segments);

    return (
        <div className={cn("flex flex-col-reverse gap-0.5", className)}>
            {Array.from({ length: segments }).map((_, i) => {
                const isActive = i < activeSegments;
                const isPeak = i === peakSegment - 1 && peakLevel > 0;
                const color = getSegmentColor(i, segments);

                return (
                    <div
                        key={i}
                        style={{
                            height: '3px',    // Spec: 3px segment height
                            width: '100%',
                            borderRadius: '0.5px',
                            backgroundColor: isActive || isPeak ? color : 'rgba(255,255,255,0.04)',
                            opacity: isActive ? (0.7 + (i / segments) * 0.3) : isPeak ? 0.9 : 1,
                            boxShadow: isActive ? `0 0 3px ${color}30` : 'none',
                            transition: 'background-color 30ms linear',
                        }}
                    />
                );
            })}
        </div>
    );
};
