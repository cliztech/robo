import { type ReactNode, useEffect, useRef } from 'react';

import { cn } from '../../lib/utils';

type TopbarHeight = 'compact' | 'comfortable' | number;

type TopbarProps = {
    children?: ReactNode;
    className?: string;
    height?: TopbarHeight;
    ariaLabel?: string;
    focusOnRender?: boolean;
    regionName?: string;
};

const topbarHeightClasses: Record<Exclude<TopbarHeight, number>, string> = {
    compact: 'h-10',
    comfortable: 'h-11',
};

function resolveTopbarHeightClass(height: TopbarHeight): string {
    return typeof height === 'number' ? '' : topbarHeightClasses[height];
}

function resolveTopbarHeightStyle(height: TopbarHeight): { height?: string } {
    return typeof height === 'number' ? { height: `${height}px` } : {};
}

export function Topbar({
    children,
    className,
    height = 'comfortable',
    ariaLabel = 'Operator status and actions',
    focusOnRender = false,
    regionName,
}: TopbarProps) {
    const topbarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!focusOnRender) {
            return;
        }

        topbarRef.current?.focus();
    }, [focusOnRender]);

    return (
        <header
            ref={topbarRef}
            aria-label={ariaLabel}
            aria-roledescription={regionName}
            tabIndex={focusOnRender ? -1 : undefined}
            className={cn(
                'bg-black/30 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-between px-5 shrink-0 z-10',
                resolveTopbarHeightClass(height),
                className
            )}
            style={resolveTopbarHeightStyle(height)}
        >
            {children}
        </header>
    );
}
