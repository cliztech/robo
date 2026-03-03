'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface DegenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
    loading?: boolean;
    icon?: React.ReactNode;
}

export function DegenButton({
    children,
    className,
    variant = 'primary',
    size = 'sm',
    loading = false,
    icon,
    disabled,
    ...props
}: DegenButtonProps) {
    const variants = {
        primary: cn(
            'bg-gradient-to-b from-white/[0.08] to-white/[0.02]',
            'border-white/[0.08] text-zinc-200',
            'hover:from-white/[0.12] hover:to-white/[0.04] hover:border-white/[0.12]',
            'hover:shadow-[0_0_15px_rgba(2,125,225,0.08)]',
            'active:bg-black/40 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
        ),
        secondary: cn(
            'bg-purple-500/[0.08] border-purple-500/[0.15] text-purple-300',
            'hover:bg-purple-500/[0.15] hover:border-purple-500/[0.25]',
            'hover:shadow-[0_0_12px_rgba(153,51,255,0.1)]',
            'active:bg-purple-900/30 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]',
        ),
        accent: cn(
            'bg-[#027de1]/[0.12] border-[#027de1]/[0.2] text-[#4da6f0]',
            'hover:bg-[#027de1]/[0.2] hover:border-[#027de1]/[0.3]',
            'hover:shadow-[0_0_12px_rgba(2,125,225,0.15)]',
            'active:bg-[#027de1]/10 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]',
        ),
        ghost: cn(
            'bg-transparent border-transparent text-zinc-500',
            'hover:bg-white/[0.04] hover:text-zinc-300 hover:border-white/[0.06]',
            'active:bg-white/[0.02] active:text-zinc-400',
        ),
        outline: cn(
            'bg-transparent border-white/[0.08] text-zinc-400',
            'hover:border-white/[0.15] hover:text-zinc-200',
            'hover:shadow-[0_0_10px_rgba(255,255,255,0.03)]',
            'active:bg-white/[0.02] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]',
        ),
        danger: cn(
            'bg-red-500/[0.08] border-red-500/[0.15] text-red-400',
            'hover:bg-red-500/[0.15] hover:border-red-500/[0.25]',
            'hover:shadow-[0_0_12px_rgba(239,68,68,0.1)]',
            'active:bg-red-900/30 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]',
        ),
    };

    const sizes = {
        xs: 'px-1.5 py-0.5 text-[7px] gap-1',
        sm: 'px-2.5 py-1 text-[9px] gap-1.5',
        md: 'px-4 py-1.5 text-[10px] gap-2',
        lg: 'px-5 py-2 text-[11px] gap-2',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center',
                'font-black uppercase tracking-[0.15em]',
                'border rounded-sm',
                'transition-all duration-150',
                'backdrop-blur-sm',
                'disabled:opacity-35 disabled:grayscale disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className,
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {!loading && icon}
            {children}
        </button>
    );
}
