import { type ReactNode, useEffect, useRef } from 'react';

import { cn } from '../../lib/utils';

type SidebarWidth = 'compact' | 'comfortable' | 'wide' | number;
type SidebarCollapseBreakpoint = 'sm' | 'md' | 'lg' | 'xl';

type SidebarProps = {
    children?: ReactNode;
    className?: string;
    width?: SidebarWidth;
    collapseBelow?: SidebarCollapseBreakpoint;
    ariaLabel?: string;
    focusOnMount?: boolean;
};

const sidebarWidthClasses: Record<Exclude<SidebarWidth, number>, string> = {
    compact: 'w-14',
    comfortable: 'w-16',
    wide: 'w-20',
};

const collapseClasses: Record<SidebarCollapseBreakpoint, string> = {
    sm: 'max-sm:hidden',
    md: 'max-md:hidden',
    lg: 'max-lg:hidden',
    xl: 'max-xl:hidden',
};

function resolveSidebarWidthClass(width: SidebarWidth): string {
    return typeof width === 'number' ? '' : sidebarWidthClasses[width];
}

function resolveSidebarStyle(width: SidebarWidth): { width?: string } {
    return typeof width === 'number' ? { width: `${width}px` } : {};
}

export function Sidebar({
    children,
    className,
    width = 'compact',
    collapseBelow,
    ariaLabel = 'Primary operator navigation',
    focusOnMount = false,
}: SidebarProps) {
    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!focusOnMount) {
            return;
        }

        sidebarRef.current?.focus();
    }, [focusOnMount]);

    return (
        <aside
            ref={sidebarRef}
            aria-label={ariaLabel}
            tabIndex={focusOnMount ? -1 : undefined}
            className={cn(
                'bg-black/40 border-r border-white/[0.04] flex flex-col items-center py-3 gap-0.5 shrink-0 backdrop-blur-md z-10',
                resolveSidebarWidthClass(width),
                collapseBelow && collapseClasses[collapseBelow],
                className
            )}
            style={resolveSidebarStyle(width)}
        >
            {children}
        </aside>
    );
}
