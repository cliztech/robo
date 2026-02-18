'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface DegenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
}

export function DegenButton({
    children,
    className,
    variant = 'primary',
    size = 'sm',
    ...props
}: DegenButtonProps) {
    const variants = {
        primary: 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200 active:bg-zinc-900',
        secondary: 'bg-purple-600/20 border-purple-600/30 text-purple-400 hover:bg-purple-600/30',
        ghost: 'bg-transparent hover:bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300',
        outline: 'bg-transparent border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
    };

    const sizes = {
        xs: 'px-1.5 py-0.5 text-[8px]',
        sm: 'px-2.5 py-1 text-[10px]',
        md: 'px-4 py-1.5 text-xs',
        lg: 'px-6 py-2 text-sm'
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-bold uppercase tracking-widest border transition-all duration-75',
                variants[variant],
                sizes[size],
                'rounded-sm disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
