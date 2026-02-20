import React from 'react';
import { cn } from '../../lib/utils';

interface DeckContainerProps {
    deck: 'A' | 'B';
    children: React.ReactNode;
    className?: string;
}

export const DeckContainer: React.FC<DeckContainerProps> = ({ deck, children, className }) => {
    const borderColor = deck === 'A' ? 'border-deck-a/30' : 'border-deck-b/30';
    const glowColor = deck === 'A' ? 'shadow-[0_0_30px_rgba(0,145,255,0.05)]' : 'shadow-[0_0_30px_rgba(255,85,0,0.05)]';

    return (
        <div className={cn(
            "relative flex flex-col h-full bg-surface-glass backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300",
            borderColor,
            glowColor,
            className
        )}>
            {/* Top Identity Bar */}
            <div className={cn(
                "h-1 w-full absolute top-0 left-0 right-0 z-10",
                deck === 'A' ? "bg-deck-a" : "bg-deck-b"
            )} />

            {children}
        </div>
    );
};
