import React from 'react';
import { cn } from '../../lib/utils';

export type DeckPanelProps = {
    label: string;
    color: string;
    bpm: string;
    musicalKey: string;
    isActive: boolean;
    children: React.ReactNode;
};

export function DeckPanel({ label, color, bpm, musicalKey, isActive, children }: DeckPanelProps) {
    return (
        <div className="glass-panel overflow-hidden">
            <div className="panel-header">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div
                            className={cn('w-2.5 h-2.5 rounded-full', isActive && 'animate-pulse')}
                            style={{
                                backgroundColor: color,
                                boxShadow: isActive ? `0 0 10px ${color}80` : 'none',
                            }}
                        />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 tabular-nums">
                            {bpm}
                        </span>
                        <span className="text-[8px] text-zinc-600">BPM</span>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/15">
                        <span className="text-[9px] font-mono font-bold text-purple-400">{musicalKey}</span>
                    </div>
                </div>
            </div>
            <div className="p-3 space-y-3">{children}</div>
        </div>
    );
}
