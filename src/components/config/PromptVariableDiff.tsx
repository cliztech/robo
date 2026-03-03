import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle } from 'lucide-react';

export interface PromptVariableChange {
    key: string;
    oldValue: string | null;
    newValue: string;
}

interface PromptVariableDiffProps {
    changes: PromptVariableChange[];
    onApprove: (approvedChanges: PromptVariableChange[]) => void;
    onReject: () => void;
    className?: string;
}

export function PromptVariableDiff({ changes, onApprove, onReject, className }: PromptVariableDiffProps) {
    const [approvedKeys, setApprovedKeys] = useState<Set<string>>(new Set(changes.map(c => c.key)));

    if (!changes || changes.length === 0) {
        return <div className="text-zinc-500 text-sm">No prompt variable changes detected.</div>;
    }

    const handleToggle = (key: string) => {
        const next = new Set(approvedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setApprovedKeys(next);
    };

    const handleApply = () => {
        const approved = changes.filter(c => approvedKeys.has(c.key));
        onApprove(approved);
    };

    return (
        <div className={cn("flex flex-col space-y-4 p-4 bg-zinc-900 rounded-xl border border-white/10", className)} aria-label="Prompt Variable Diff Review">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle size={16} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Review Prompt Changes</h3>
            </div>
            
            <div className="space-y-3">
                {changes.map((change) => (
                    <div key={change.key} className="flex gap-3 p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="pt-1">
                            <input 
                                type="checkbox"
                                aria-label={`Approve change for ${change.key}`}
                                checked={approvedKeys.has(change.key)}
                                onChange={() => handleToggle(change.key)}
                                className="w-4 h-4 accent-lime-500 rounded border-white/20"
                            />
                        </div>
                        <div className="flex-1 min-w-0 font-mono text-xs">
                            <div className="text-white mb-2 text-sm">{change.key}</div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-zinc-500 uppercase text-[9px] tracking-widest">Previous</div>
                                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-200 whitespace-pre-wrap break-words">
                                        {change.oldValue === null ? <span className="italic opacity-50">Not Set</span> : change.oldValue}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-zinc-500 uppercase text-[9px] tracking-widest">Proposed</div>
                                    <div className="p-2 rounded bg-lime-500/10 border border-lime-500/20 text-lime-200 whitespace-pre-wrap break-words">
                                        {change.newValue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
                <button 
                    onClick={onReject}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                    <X size={14} /> Reject All
                </button>
                <button 
                    onClick={handleApply}
                    disabled={approvedKeys.size === 0}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-lime-400 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                >
                    <Check size={14} /> Approve Selected ({approvedKeys.size})
                </button>
            </div>
        </div>
    );
}
