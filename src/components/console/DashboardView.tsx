'use client';

import { useEffect, useId, useMemo, useState, type ElementType } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Gauge,
    Minus,
    Signal,
    TrendingDown,
    TrendingUp,
    Users,
    Wifi,
    Zap,
} from 'lucide-react';
import { DegenEffectRack } from '@/components/audio/DegenEffectRack';
import { DegenBeatGrid } from '@/components/audio/DegenBeatGrid';
import { DegenWaveform } from '@/components/audio/DegenWaveform';
import { DegenScheduleTimeline } from '@/components/schedule/DegenScheduleTimeline';
import { DegenAIHost } from '@/components/ai/DegenAIHost';
import { cn } from '@/lib/utils';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface DashboardAlertItem {
    alert_id: string;
    severity: AlertSeverity;
    title: string;
    description: string;
    created_at: string;
    acknowledged: boolean;
    acknowledged_at: string | null;
}

export interface DashboardStatusResponse {
    service_health: {
        status: 'healthy' | 'degraded' | 'offline';
        reason: string;
        observed_at: string;
    };
    queue_depth: {
        current_depth: number;
        trend: Array<{ timestamp: string; depth: number }>;
        thresholds: { warning: number; critical: number };
        state: AlertSeverity;
    };
    rotation: {
        last_successful_rotation_at: string;
        stale_after_minutes: number;
        is_stale: boolean;
        stale_reason: string | null;
    };
    alert_center: {
        filters: AlertSeverity[];
        items: DashboardAlertItem[];
    };
}

export interface DashboardStatusApi {
    fetchDashboardStatus: () => Promise<DashboardStatusResponse>;
    acknowledgeAlert: (alertId: string) => Promise<DashboardAlertItem>;
}

async function parseError(response: Response): Promise<string> {
    const payload = await response.json().catch(() => ({ detail: 'Unable to load dashboard status' }));
    return payload.detail ?? 'Unable to load dashboard status';
}

const dashboardStatusApi: DashboardStatusApi = {
    async fetchDashboardStatus() {
        const response = await fetch('/api/v1/status/dashboard');
        if (!response.ok) {
            throw new Error(await parseError(response));
        }
        return (await response.json()) as DashboardStatusResponse;
    },
    async acknowledgeAlert(alertId: string) {
        const response = await fetch(`/api/v1/status/dashboard/alerts/${alertId}/ack`, { method: 'POST' });
        if (!response.ok) {
            throw new Error(await parseError(response));
        }
        return (await response.json()) as DashboardAlertItem;
    },
};

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: ElementType;
    color?: 'lime' | 'purple' | 'cyan' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'stable';
    sparkline?: number[];
    delay?: number;
}

function StatCard({
    label,
    value,
    unit,
    icon: Icon,
    color = 'lime',
    trend,
    sparkline,
    delay = 0,
}: StatCardProps) {
    const sparkId = useId();
    const colors = {
        lime: { gradient: 'from-lime-500/8 via-lime-500/3 to-transparent', border: 'border-lime-500/15', icon: 'text-lime-500/70', spark: '#aaff00' },
        purple: { gradient: 'from-purple-500/8 via-purple-500/3 to-transparent', border: 'border-purple-500/15', icon: 'text-purple-500/70', spark: '#9933ff' },
        cyan: { gradient: 'from-cyan-500/8 via-cyan-500/3 to-transparent', border: 'border-cyan-500/15', icon: 'text-cyan-500/70', spark: '#00bfff' },
        orange: { gradient: 'from-orange-500/8 via-orange-500/3 to-transparent', border: 'border-orange-500/15', icon: 'text-orange-500/70', spark: '#ff6b00' },
        red: { gradient: 'from-red-500/8 via-red-500/3 to-transparent', border: 'border-red-500/15', icon: 'text-red-500/70', spark: '#ef4444' },
    };

    const points = sparkline ?? [30, 45, 38, 52, 48, 60, 55, 70, 65, 75, 72, 80];
    const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const TrendIcon = trendIcon;
    const trendClass = trend === 'up' ? 'text-lime-500' : trend === 'down' ? 'text-red-400' : 'text-zinc-600';
    const c = colors[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.25 }}
            className={cn('rounded-xl border p-4 bg-gradient-to-br', c.gradient, c.border)}
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
                        <Icon size={13} className={c.icon} />
                        <span>{label}</span>
                    </div>
                    <div className="mt-1 text-2xl font-black text-white tabular-nums">
                        {value}
                        {unit ? <span className="ml-1 text-[10px] font-medium text-zinc-500">{unit}</span> : null}
                    </div>
                </div>
                {trend ? <TrendIcon size={10} className={trendClass} /> : null}
            </div>

            <div className="mt-3 h-6">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c.spark} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={c.spark} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M 0 30 ${points
                            .map((v, i, arr) => `L ${(i / (arr.length - 1)) * 100} ${30 - (v / 100) * 28}`)
                            .join(' ')} L 100 30 Z`}
                        fill={`url(#${sparkId})`}
                    />
                    <polyline
                        points={points
                            .map((v, i, arr) => `${(i / (arr.length - 1)) * 100},${30 - (v / 100) * 28}`)
                            .join(' ')}
                        fill="none"
                        stroke={c.spark}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                    />
                </svg>
            </div>
        </motion.div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{children}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
        </div>
    );
}

function deriveQueueSeverity(currentDepth: number, thresholds: DashboardStatusResponse['queue_depth']['thresholds']): AlertSeverity {
    if (currentDepth >= thresholds.critical) {
        return 'critical';
    }
    if (currentDepth >= thresholds.warning) {
        return 'warning';
    }
    return 'info';
}

function formatTimestamp(value: string | null): string {
    if (!value) {
        return '—';
    }
    return new Date(value).toLocaleString();
}

export function DashboardView({ telemetry, api = dashboardStatusApi }: { telemetry?: unknown; api?: DashboardStatusApi }) {
    const [currentTime, setCurrentTime] = useState('');
    const [status, setStatus] = useState<DashboardStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    void telemetry;

    useEffect(() => {
        const tick = () => {
            setCurrentTime(
                new Date().toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
            );
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.fetchDashboardStatus();
                if (mounted) {
                    setStatus(response);
                }
            } catch (loadError) {
                if (mounted) {
                    setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard status');
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            mounted = false;
        };
    }, [api]);

    const queueSeverity = useMemo(() => {
        if (!status) {
            return 'info';
        }
        return deriveQueueSeverity(status.queue_depth.current_depth, status.queue_depth.thresholds);
    }, [status]);

    const alertCounts = useMemo(() => {
        const base = { info: 0, warning: 0, critical: 0 };
        if (!status) {
            return base;
        }
        for (const alert of status.alert_center.items) {
            if (!alert.acknowledged) {
                base[alert.severity] += 1;
            }
        }
        return base;
    }, [status]);

    const handleAcknowledge = async (alertId: string) => {
        if (!status) {
            return;
        }

        const now = new Date().toISOString();
        setStatus({
            ...status,
            alert_center: {
                ...status.alert_center,
                items: status.alert_center.items.map((item) =>
                    item.alert_id === alertId ? { ...item, acknowledged: true, acknowledged_at: item.acknowledged_at ?? now } : item
                ),
            },
        });

        try {
            const updated = await api.acknowledgeAlert(alertId);
            setStatus((previous) => {
                if (!previous) {
                    return previous;
                }
                return {
                    ...previous,
                    alert_center: {
                        ...previous.alert_center,
                        items: previous.alert_center.items.map((item) => (item.alert_id === alertId ? updated : item)),
                    },
                };
            });
        } catch {
            setError('Failed to acknowledge alert');
        }
    };

    if (isLoading) {
        return <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">Loading dashboard status…</div>;
    }

    if (error) {
        return (
            <div role="alert" className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
            </div>
        );
    }

    if (!status) {
        return null;
    }

    return (
        <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Station <span className="text-lime-400">Overview</span>
                    </h1>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{status.service_health.reason}</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">{currentTime}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Local Time</div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <StatCard label="Service" value={status.service_health.status.toUpperCase()} icon={Activity} trend="stable" />
                <StatCard label="Queue Depth" value={status.queue_depth.current_depth} icon={Users} color={queueSeverity === 'critical' ? 'red' : queueSeverity === 'warning' ? 'orange' : 'purple'} trend="up" delay={0.05} />
                <StatCard label="Warning Threshold" value={status.queue_depth.thresholds.warning} unit="jobs" icon={Gauge} color="cyan" trend="stable" delay={0.1} />
                <StatCard label="Critical Threshold" value={status.queue_depth.thresholds.critical} unit="jobs" icon={Wifi} trend="stable" delay={0.15} />
                <StatCard label="Stale After" value={status.rotation.stale_after_minutes} unit="min" icon={Zap} color="orange" trend={status.rotation.is_stale ? 'up' : 'stable'} delay={0.2} />
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span data-testid="queue-depth-state">Queue severity: {queueSeverity}</span>
                    <span>Last rotation: {formatTimestamp(status.rotation.last_successful_rotation_at)}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                    <span data-testid="severity-count-info">Info: {alertCounts.info}</span>
                    <span data-testid="severity-count-warning">Warning: {alertCounts.warning}</span>
                    <span data-testid="severity-count-critical">Critical: {alertCounts.critical}</span>
                </div>
            </div>

            <SectionHeader>Alert Center</SectionHeader>
            <div className="space-y-2">
                {status.alert_center.items.map((item) => (
                    <div key={item.alert_id} className={cn('rounded-lg border p-3', item.acknowledged ? 'opacity-60 border-zinc-800' : 'border-zinc-700')}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                                <p className="text-xs text-zinc-400">{item.description}</p>
                                <p className="text-xs text-zinc-500" data-testid={`alert-ack-${item.alert_id}`}>
                                    Ack at: {formatTimestamp(item.acknowledged_at)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-200 disabled:opacity-40"
                                onClick={() => handleAcknowledge(item.alert_id)}
                                disabled={item.acknowledged}
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <SectionHeader>Now Playing</SectionHeader>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                    <div className="glass-panel overflow-hidden">
                        <div className="panel-header">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(170,255,0,0.45)' }} />
                                <span className="panel-header-title">Master Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Signal size={10} className="text-lime-500" />
                                <span className="text-[9px] font-mono text-zinc-500">AAC 320k</span>
                            </div>
                        </div>
                        <div className="p-3">
                            <DegenWaveform
                                progress={0.42}
                                duration={234}
                                trackTitle="Neural Drift v2.1 - SynthKong"
                                isPlaying
                                cuePoints={[
                                    { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                                    { position: 0.68, label: 'DROP', color: '#bf00ff' },
                                ]}
                            />
                        </div>
                    </div>
                    <SectionHeader>On-Air Schedule</SectionHeader>
                    <DegenScheduleTimeline />
                </div>

                <div className="space-y-4">
                    <DegenAIHost className="glass-panel" />
                </div>
            </div>

            <SectionHeader>Audio Engine</SectionHeader>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="glass-panel overflow-hidden">
                    <div className="panel-header">
                        <span className="panel-header-title">Beat Sequencer</span>
                    </div>
                    <div className="p-3">
                        <DegenBeatGrid decks={4} steps={16} />
                    </div>
                </div>

                <DegenEffectRack
                    title="Master FX"
                    deck="MST"
                    isActive
                    controls={[
                        { key: 'reverb', label: 'Reverb', unit: '%' },
                        { key: 'comp', label: 'Comp', unit: 'dB', max: 30 },
                        { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                        { key: 'limit', label: 'Limiter', unit: 'dB', max: 0 },
                        { key: 'width', label: 'Stereo', unit: '%' },
                    ]}
                />
            </div>
        </div>
    );
}

export { deriveQueueSeverity };
