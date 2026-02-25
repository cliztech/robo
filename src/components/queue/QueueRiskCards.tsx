import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QueueRisk {
    id: string;
    confidence: number; // 0-1
    why: string;
    mitigation: string;
    severity: 'low' | 'medium' | 'high';
}

interface QueueRiskCardsProps {
    risks: QueueRisk[];
    className?: string;
}

export function QueueRiskCards({ risks, className }: QueueRiskCardsProps) {
    if (!risks || risks.length === 0) {
        return null;
    }

    const severityConfig = {
        low: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        medium: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        high: { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    };

    return (
        <div className={cn("space-y-2 flex flex-col", className)} role="region" aria-label="Queue Risks">
            {risks.map((risk) => {
                const config = severityConfig[risk.severity];
                const Icon = config.icon;
                
                return (
                    <div 
                        key={risk.id}
                        className={cn("p-3 rounded-lg border flex gap-3", config.bg, config.border)}
                    >
                        <div className={cn("shrink-0", config.color)}>
                            <Icon size={16} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>
                                    {risk.severity} Risk
                                </span>
                                <span className="text-[10px] text-zinc-500 tabular-nums">
                                    {(risk.confidence * 100).toFixed(0)}% confidence
                                </span>
                            </div>
                            <div className="text-sm text-zinc-300">
                                {risk.why}
                            </div>
                            <div className="text-xs text-zinc-500 flex gap-1">
                                <span className="font-semibold">Fix:</span> 
                                <span>{risk.mitigation}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
