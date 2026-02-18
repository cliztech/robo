import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';

type TabStripAlign = 'start' | 'center' | 'between';

type TabStripProps = {
    children?: ReactNode;
    className?: string;
    ariaLabel?: string;
    region?: 'primary' | 'secondary';
    responsiveWrap?: boolean;
    align?: TabStripAlign;
};

const alignClasses: Record<TabStripAlign, string> = {
    start: 'justify-start',
    center: 'justify-center',
    between: 'justify-between',
};

const regionClasses: Record<NonNullable<TabStripProps['region']>, string> = {
    primary: 'gap-2',
    secondary: 'gap-1.5',
};

export function TabStrip({
    children,
    className,
    ariaLabel = 'Workspace sections',
    region = 'primary',
    responsiveWrap = true,
    align = 'start',
}: TabStripProps) {
    return (
        <nav
            aria-label={ariaLabel}
            className={cn(
                'flex items-center',
                alignClasses[align],
                regionClasses[region],
                responsiveWrap ? 'flex-wrap' : 'flex-nowrap',
                className
            )}
        >
            {children}
        </nav>
    );
}
