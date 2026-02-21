import React from 'react';
import { cn } from '../../lib/utils';

interface DeckContainerProps {
    deck: 'A' | 'B';
    children: React.ReactNode;
    className?: string;
}

export const DeckContainer: React.FC<DeckContainerProps> = ({ deck, children, className }) => {
    return (
        <div className={cn(
            "relative flex flex-col bg-panel-1 border border-white/5 rounded-lg overflow-hidden",
            className
        )}>
            {/* Top accent line */}
            <div className={cn(
                "h-0.5 w-full shrink-0",
                deck === 'A' ? "bg-deck-a/40" : "bg-deck-b/40"
            )} />
            {children}
        </div>
    );
};
