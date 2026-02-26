import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Info, X, ChevronRight } from 'lucide-react';

export interface AlertMessage {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    impact: string;
    remediationCTA: string;
    onRemediate?: () => void;
}

interface AlertCenterProps {
    alerts: AlertMessage[];
    onDismiss: (id: string) => void;
    className?: string;
}

export function AlertCenter({ alerts, onDismiss, className }: AlertCenterProps) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    const severityConfig = {
        critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', ctaBg: 'bg-red-500/20 hover:bg-red-500/30 text-red-100' },
        warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', ctaBg: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100' },
        info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', ctaBg: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-100' },
    };

    return (
        <div 
            className={cn("flex flex-col space-y-3", className)} 
            role="region" 
            aria-label="Alert Center"
            aria-live="polite"
        >
            {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                
                return (
                    <div 
                        key={alert.id}
                        className={cn("relative p-4 rounded-xl border flex flex-col gap-2", config.bg, config.border)}
                    >
                        <button 
                            type="button"
                            onClick={() => onDismiss(alert.id)}
                            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                            aria-label={`Dismiss ${alert.severity} alert`}
                        >
                            <X size={14} />
                        </button>

                        <div className="flex gap-3">
                            <div className={cn("shrink-0 pt-0.5", config.color)}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1 space-y-1.5 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-white">
                                    {alert.message}
                                </div>
                                <div className="text-xs text-zinc-300">
                                    <span className="font-semibold text-zinc-500">Impact: </span>
                                    {alert.impact}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-2 pl-7">
                            <button
                                type="button"
                                onClick={alert.onRemediate}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors w-max", config.ctaBg)}
                                aria-label={alert.remediationCTA}
                            >
                                {alert.remediationCTA}
                                <ChevronRight size={14} className="opacity-70" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
