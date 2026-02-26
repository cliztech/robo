'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export function GorillaLogo({ className, size = 32 }: { className?: string; size?: number }) {
    return (
        <div className={cn('animate-breathe', className)} style={{ width: size, height: size }}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#027de1" />
                        <stop offset="50%" stopColor="#4da6f0" />
                        <stop offset="100%" stopColor="#015bad" />
                    </linearGradient>
                    <linearGradient id="logo-hover" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.08)">
                            <animate
                                attributeName="stopColor"
                                values="rgba(255,255,255,0.02);rgba(255,255,255,0.1);rgba(255,255,255,0.02)"
                                dur="4s"
                                repeatCount="indefinite"
                            />
                        </stop>
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="0 0 0 0 0.007  0 0 0 0 0.49  0 0 0 0 0.88  0 0 0 0.5 0"
                        />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="earpad-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.007  0 0 0 0 0.49  0 0 0 0 0.88  0 0 0 0.35 0"
                        />
                    </filter>
                </defs>

                {/* Earpad ambient glow */}
                <rect x="22" y="63" width="28" height="46" rx="10" fill="#027de1" filter="url(#earpad-glow)" opacity="0.4">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
                </rect>
                <rect x="150" y="63" width="28" height="46" rx="10" fill="#027de1" filter="url(#earpad-glow)" opacity="0.4">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" begin="1.5s" />
                </rect>

                <g filter="url(#logo-glow)">
                    {/* Gorilla face outline */}
                    <path
                        d="M 60 40 Q 100 20 140 40 L 150 70 Q 170 100 150 130 L 140 160 Q 100 180 60 160 L 50 130 Q 30 100 50 70 Z"
                        fill="url(#logo-hover)"
                        stroke="url(#logo-gradient)"
                        strokeWidth="4.5"
                        strokeLinejoin="round"
                    />
                    {/* Eyes */}
                    <circle cx="80" cy="85" r="7" fill="#027de1" />
                    <circle cx="120" cy="85" r="7" fill="#027de1" />
                    {/* Eye glints */}
                    <circle cx="82" cy="83" r="2.5" fill="white" opacity="0.9" />
                    <circle cx="122" cy="83" r="2.5" fill="white" opacity="0.9" />
                    {/* Pupil sparkle */}
                    <circle cx="78" cy="87" r="1" fill="white" opacity="0.3" />
                    <circle cx="118" cy="87" r="1" fill="white" opacity="0.3" />
                    {/* Brow ridge */}
                    <path
                        d="M 68 74 Q 80 68 92 74"
                        fill="none"
                        stroke="#027de1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.4"
                    />
                    <path
                        d="M 108 74 Q 120 68 132 74"
                        fill="none"
                        stroke="#027de1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.4"
                    />
                    {/* Nose bridge */}
                    <ellipse cx="100" cy="108" rx="12" ry="8" fill="none" stroke="#027de1" strokeWidth="2" opacity="0.25" />
                    {/* Mouth */}
                    <path
                        d="M 82 128 Q 100 140 118 128"
                        fill="none"
                        stroke="#027de1"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    {/* Headphones bridge */}
                    <path
                        d="M 38 80 Q 100 5 162 80"
                        fill="none"
                        stroke="url(#logo-gradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    {/* Earpads */}
                    <rect x="25" y="66" width="20" height="38" rx="7" fill="#027de1" opacity="0.9" />
                    <rect x="155" y="66" width="20" height="38" rx="7" fill="#027de1" opacity="0.9" />
                    {/* Inner earpad detail */}
                    <rect x="29" y="72" width="12" height="26" rx="5" fill="black" opacity="0.35" />
                    <rect x="159" y="72" width="12" height="26" rx="5" fill="black" opacity="0.35" />
                    {/* Earpad highlight */}
                    <rect x="29" y="72" width="12" height="8" rx="4" fill="white" opacity="0.06" />
                    <rect x="159" y="72" width="12" height="8" rx="4" fill="white" opacity="0.06" />
                </g>
            </svg>
        </div>
    );
}
