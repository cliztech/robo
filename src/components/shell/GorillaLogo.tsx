'use client';

import React from 'react';

export function GorillaLogo({ className, size = 32 }: { className?: string; size?: number }) {
    return (
        <div className={className} style={{ width: size, height: size }}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#027de1" />
                        <stop offset="100%" stopColor="#015bad" />
                    </linearGradient>
                    <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="0 0 0 0 0.007  0 0 0 0 0.49  0 0 0 0 0.88  0 0 0 0.4 0"
                        />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g filter="url(#logo-glow)">
                    {/* Gorilla face outline */}
                    <path
                        d="M 60 40 Q 100 20 140 40 L 150 70 Q 170 100 150 130 L 140 160 Q 100 180 60 160 L 50 130 Q 30 100 50 70 Z"
                        fill="none"
                        stroke="url(#logo-gradient)"
                        strokeWidth="5"
                        strokeLinejoin="round"
                    />
                    {/* Eyes */}
                    <circle cx="80" cy="85" r="7" fill="#027de1" />
                    <circle cx="120" cy="85" r="7" fill="#027de1" />
                    {/* Eye glints */}
                    <circle cx="82" cy="83" r="2" fill="white" opacity="0.8" />
                    <circle cx="122" cy="83" r="2" fill="white" opacity="0.8" />
                    {/* Mouth */}
                    <path
                        d="M 82 128 Q 100 138 118 128"
                        fill="none"
                        stroke="#027de1"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                    {/* Headphones bridge */}
                    <path
                        d="M 40 80 Q 100 5 160 80"
                        fill="none"
                        stroke="url(#logo-gradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    {/* Earpads with rounded glow */}
                    <rect x="27" y="68" width="18" height="36" rx="6" fill="#027de1" opacity="0.9" />
                    <rect x="155" y="68" width="18" height="36" rx="6" fill="#027de1" opacity="0.9" />
                    {/* Inner earpad detail */}
                    <rect x="30" y="74" width="12" height="24" rx="4" fill="black" opacity="0.3" />
                    <rect x="158" y="74" width="12" height="24" rx="4" fill="black" opacity="0.3" />
                </g>
            </svg>
        </div>
    );
}
