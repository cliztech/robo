import React, { useState, useRef, useCallback, useEffect } from 'react';

interface JogWheelProps {
    deck: 'A' | 'B';
    playing?: boolean;
    bpm?: number;
    pitch?: number;
    musicalKey?: string;
    timeRemaining?: string;
}

export const JogWheel: React.FC<JogWheelProps> = ({
    deck,
    playing = false,
    bpm = deck === 'A' ? 128.00 : 126.50,
    pitch = 0.0,
    musicalKey = deck === 'A' ? '8A' : '3B',
    timeRemaining = deck === 'A' ? '-3:42' : '-5:18',
}) => {
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const lastAngle = useRef(0);
    const wheelRef = useRef<HTMLDivElement>(null);

    const accentColor = deck === 'A' ? '#0091FF' : '#FF5500';

    const getAngle = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!wheelRef.current) return 0;
        const rect = wheelRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastAngle.current = getAngle(e);
        const handleMove = (ev: MouseEvent) => {
            const newAngle = getAngle(ev);
            const delta = newAngle - lastAngle.current;
            setRotation(prev => prev + delta);
            lastAngle.current = newAngle;
        };
        const handleUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    // LED arc progress (0-1)
    const progress = 0.65;
    const arcDeg = progress * 300;
    // Auto-rotate when playing (33.33 RPM vinyl simulation)
    useEffect(() => {
        if (!playing || isDragging) return;
        const interval = setInterval(() => {
            setRotation(prev => prev + 2); // ~33 RPM
        }, 50);
        return () => clearInterval(interval);
    }, [playing, isDragging]);

    return (
        /* Optical correction: +4px upward centering via negative margin */
        <div className="flex items-center justify-center" style={{ marginTop: '-4px' }}>
            <div
                ref={wheelRef}
                className="relative cursor-grab active:cursor-grabbing select-none"
                style={{ width: '318px', height: '318px' }}
                onMouseDown={handleMouseDown}
            >
                {/* 3px LED Arc */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 318 318"
                    fill="none"
                >
                    {/* Background arc */}
                    <circle cx="159" cy="159" r="155" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none"
                        strokeDasharray={`${Math.PI * 310 * (300 / 360)}`}
                        strokeDashoffset="0"
                        transform="rotate(-240 159 159)"
                        strokeLinecap="round"
                    />
                    {/* Active arc at 65% saturation tint */}
                    <circle cx="159" cy="159" r="155" stroke={accentColor} strokeWidth="3" fill="none"
                        strokeDasharray={`${Math.PI * 310 * (arcDeg / 360)} ${Math.PI * 310}`}
                        transform="rotate(-240 159 159)"
                        strokeLinecap="round"
                        style={{ opacity: 0.65, filter: `drop-shadow(0 0 4px ${accentColor}40)` }}
                    />
                </svg>

                {/* Main wheel body — anodized aluminum */}
                <div
                    className="absolute bg-anodized-aluminum noise-grain rounded-full"
                    style={{
                        inset: '12px',
                        transform: `rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                        boxShadow: `
                            inset 0 1px 0 rgba(255,255,255,0.06),
                            inset 0 -1px 0 rgba(0,0,0,0.3),
                            0 4px 16px rgba(0,0,0,0.5)
                        `
                    }}
                >
                    {/* 1px inner edge bevel at 6% */}
                    <div className="absolute inset-0 rounded-full border border-white/6" />

                    {/* Vinyl groove rings */}
                    {[30, 50, 70, 90, 110].map(r => (
                        <div key={r} className="absolute rounded-full" style={{
                            inset: `${r}px`,
                            border: '0.5px solid rgba(255,255,255,0.03)',
                        }} />
                    ))}

                    {/* Position needle indicator */}
                    <div className="absolute" style={{
                        left: '50%',
                        top: '8px',
                        width: '2px',
                        height: '30px',
                        background: `linear-gradient(180deg, ${accentColor} 0%, transparent 100%)`,
                        transformOrigin: '50% 50%',
                        transform: 'translateX(-1px)',
                        borderRadius: '1px',
                        boxShadow: `0 0 4px ${accentColor}40`,
                    }} />

                    {/* Tick marks */}
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="absolute" style={{
                            left: '50%',
                            top: '12px',
                            width: '1px',
                            height: i % 6 === 0 ? '10px' : '5px',
                            background: `rgba(255,255,255,${i % 6 === 0 ? 0.15 : 0.06})`,
                            transformOrigin: `0 ${(318 - 24) / 2 - 12}px`,
                            transform: `translateX(-0.5px) rotate(${i * 15}deg)`,
                        }} />
                    ))}
                </div>

                {/* Center LCD display — does NOT rotate */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className="flex flex-col items-center justify-center rounded-full"
                        style={{
                            width: '120px',
                            height: '120px',
                            background: 'rgba(15,18,22,0.9)',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                        }}
                    >
                        {/* Album art placeholder */}
                        <div className="w-10 h-10 rounded-sm bg-panel-3 mb-1 flex items-center justify-center overflow-hidden">
                            <span className="text-lg text-zinc-700">♫</span>
                        </div>
                        <div className="tabular-nums tracking-title" style={{
                            fontSize: '36px', fontWeight: 600, lineHeight: '36px',
                            color: accentColor,
                            textShadow: `0 0 8px ${accentColor}30`
                        }}>
                            {bpm.toFixed(2)}
                        </div>

                        {/* Pitch — 14px */}
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-zinc-500 font-mono tabular-nums" style={{ fontSize: '14px' }}>
                                {pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}%
                            </span>
                        </div>

                        {/* Key + Time — 12-14px */}
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="font-mono tracking-micro" style={{
                                fontSize: '14px', color: '#2ECC71'
                            }}>
                                {musicalKey}
                            </span>
                            <span className="font-mono tabular-nums text-zinc-600" style={{ fontSize: '12px' }}>
                                {timeRemaining}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Accent ring */}
                <div
                    className="absolute rounded-full"
                    style={{
                        inset: '10px',
                        border: `1px solid ${accentColor}15`,
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </div>
    );
};
