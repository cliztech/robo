import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight } from 'lucide-react';

export interface ConflictHint {
    id: string;
    blockId1: string;
    blockId2: string;
    reasonCode: 'OVERLAP_HARD' | 'OVERLAP_SOFT' | 'CAPACITY_EXCEEDED';
    description: string;
    suggestedFix: string;
    onApplyFix?: () => void;
}

interface ScheduleConflictsProps {
    conflicts: ConflictHint[];
    className?: string;
}

export function ScheduleConflicts({ conflicts, className }: ScheduleConflictsProps) {
    if (!conflicts || conflicts.length === 0) {
        return null;
    }

    const reasonColorMap = {
        OVERLAP_HARD: 'text-red-500 bg-red-500/10 border-red-500/20',
        OVERLAP_SOFT: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        CAPACITY_EXCEEDED: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    };

    return (
        <div className={cn("space-y-2", className)} aria-label="Timeline Conflicts">
            {conflicts.map(conflict => {
                const colors = reasonColorMap[conflict.reasonCode];
                return (
                    <div 
                        key={conflict.id} 
                        className={cn("p-3 rounded-md border flex items-start gap-3", colors)}
                    >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold font-mono tracking-wide">
                                    {conflict.reasonCode}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-200">
                                {conflict.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Fix Path</span>
                                <ArrowRight size={10} className="text-zinc-600" />
                                <span className="text-xs font-medium text-white">{conflict.suggestedFix}</span>
                                {conflict.onApplyFix && (
                                    <button 
                                        onClick={conflict.onApplyFix}
                                        className="ml-auto text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
