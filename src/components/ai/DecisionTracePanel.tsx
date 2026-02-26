import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';

export interface DecisionTrace {
    id: string;
    action: string;
    rationale: string;
    severity: 'info' | 'warning' | 'critical';
    sourceLinks: Array<{ label: string; url: string }>;
    timestamp: Date;
}

interface DecisionTracePanelProps {
    decisions: DecisionTrace[];
    className?: string;
}

export function DecisionTracePanel({ decisions, className }: DecisionTracePanelProps) {
    const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

    if (!decisions) return null;

    const filteredDecisions = decisions
        .filter(d => filter === 'all' || d.severity === filter)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

    const severityColors = {
        info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    };

    return (
        <div className={cn("flex flex-col space-y-3 p-4 rounded-xl bg-zinc-900 border border-white/5", className)} aria-label="Decision Trace Panel">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-semibold text-white tracking-wide">Automation Trace</h3>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-zinc-500" />
                    <select 
                        aria-label="Filter by severity"
                        className="text-xs bg-black text-zinc-300 border border-white/10 rounded px-1 py-0.5"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">All</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                {filteredDecisions.length === 0 ? (
                    <div className="text-xs text-zinc-500 italic py-2 text-center">No trace events found.</div>
                ) : (
                    filteredDecisions.map((decision) => (
                        <div key={decision.id} className={cn("p-2.5 rounded-lg border text-xs", severityColors[decision.severity])}>
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white">{decision.action}</span>
                                <span className="text-[9px] text-zinc-400 tabular-nums">
                                    {decision.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="text-zinc-300 leading-relaxed mb-2">
                                {decision.rationale}
                            </div>
                            {decision.sourceLinks && decision.sourceLinks.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] text-zinc-500">Sources:</span>
                                    {decision.sourceLinks.map((link, idx) => (
                                        <a 
                                            key={idx} 
                                            href={link.url}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
                                            target="_blank" rel="noopener noreferrer"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
