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
            "relative flex flex-col bg-dark-metal premium-panel rounded-xl overflow-hidden p-0.5",
            deck === 'A' ? "deck-glow-A" : "deck-glow-B",
            className
        )}>
            {/* Corner Screws for Hardware aesthetics */}
            <div className="hardware-screw top-2 left-2" />
            <div className="hardware-screw top-2 right-2" />
            <div className="hardware-screw bottom-2 left-2" />
            <div className="hardware-screw bottom-2 right-2" />

            <div className="absolute inset-x-0 h-8 top-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full h-full p-2 bg-panel-2/50 backdrop-blur-md rounded-lg shadow-inner">
                {children}
            </div>
        </div>
    );
};
