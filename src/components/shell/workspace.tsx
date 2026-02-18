import { type ReactNode, useEffect, useRef } from 'react';

import { cn } from '../../lib/utils';

type WorkspacePadding = 'none' | 'compact' | 'comfortable' | 'spacious';

type WorkspaceProps = {
    children?: ReactNode;
    className?: string;
    padding?: WorkspacePadding;
    scrollable?: boolean;
    ariaLabel?: string;
    focusOnContentChange?: boolean;
    focusKey?: string | number;
};

const workspacePaddingClasses: Record<WorkspacePadding, string> = {
    none: 'p-0',
    compact: 'p-4',
    comfortable: 'p-5',
    spacious: 'p-6',
};

export function Workspace({
    children,
    className,
    padding = 'comfortable',
    scrollable = true,
    ariaLabel = 'Primary workspace',
    focusOnContentChange = false,
    focusKey,
}: WorkspaceProps) {
    const workspaceRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!focusOnContentChange) {
            return;
        }

        workspaceRef.current?.focus();
    }, [focusOnContentChange, focusKey]);

    return (
        <main
            ref={workspaceRef}
            aria-label={ariaLabel}
            tabIndex={focusOnContentChange ? -1 : undefined}
            className={cn(
                'flex-1 relative',
                scrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden',
                workspacePaddingClasses[padding],
                className
            )}
        >
            {children}
        </main>
    );
}
