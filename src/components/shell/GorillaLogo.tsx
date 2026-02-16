'use client';

import React from 'react';

export function GorillaLogo({ className }: { className?: string }) {
    return (
        <div className={className}>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_10px_rgba(170,255,0,0.5)]">
                {/* Simplified Gorilla Face with headphones in Degen style */}
                <path
                    d="M 60 40 Q 100 20 140 40 L 150 70 Q 170 100 150 130 L 140 160 Q 100 180 60 160 L 50 130 Q 30 100 50 70 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-lime-500"
                />
                {/* Eyes */}
                <circle cx="75" cy="85" r="8" fill="currentColor" className="text-lime-500 animate-pulse" />
                <circle cx="125" cy="85" r="8" fill="currentColor" className="text-lime-500 animate-pulse" />
                {/* Mouth/Muzzle */}
                <path
                    d="M 80 130 Q 100 140 120 130"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-lime-500"
                />
                {/* Headphones bridge */}
                <path
                    d="M 40 80 Q 100 0 160 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-lime-500"
                />
                {/* Earpads */}
                <rect x="25" y="70" width="20" height="40" rx="5" fill="currentColor" className="text-lime-500" />
                <rect x="155" y="70" width="20" height="40" rx="5" fill="currentColor" className="text-lime-500" />
            </svg>
        </div>
    );
}
