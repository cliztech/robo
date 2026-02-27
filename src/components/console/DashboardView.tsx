"use client";

import { useEffect, useId, useState, type ElementType } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenBeatGrid } from "@/components/audio/DegenBeatGrid";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
import { cn } from "@/lib/utils";
import {
  type DashboardCardColor,
  type DashboardTelemetry,
  mapSeverityToCardColor,
  mapSeverityToStatusTextClass,
  mapStatusToTrend,
} from "./dashboard.types";
import { useEffect, useId, useMemo, useState, type ElementType } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Gauge,
    Minus,
    RefreshCw,
    Signal,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { DegenEffectRack } from '@/components/audio/DegenEffectRack';
import { DegenBeatGrid } from '@/components/audio/DegenBeatGrid';
import { DegenWaveform } from '@/components/audio/DegenWaveform';
import { DegenScheduleTimeline } from '@/components/schedule/DegenScheduleTimeline';
import { DegenAIHost } from '@/components/ai/DegenAIHost';
import {
    acknowledgeDashboardAlert,
    fetchDashboardAlerts,
    fetchDashboardStatus,
    type AlertCenterItem,
    type AlertSeverity,
    type DashboardStatusResponse,
} from '@/lib/status/dashboardClient';
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
  color?: DashboardCardColor;
  trend?: "up" | "down" | "stable";
  sparkline?: number[];
  delay?: number;
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color = "lime",
  trend,
  sparkline,
  delay = 0,
}: StatCardProps) {
  const sparkId = useId();
  const colors = {
    lime: {
      gradient: "from-lime-500/8 via-lime-500/3 to-transparent",
      border: "border-lime-500/15",
      icon: "text-lime-500/70",
      spark: "#aaff00",
    },
    purple: {
      gradient: "from-purple-500/8 via-purple-500/3 to-transparent",
      border: "border-purple-500/15",
      icon: "text-purple-500/70",
      spark: "#9933ff",
    },
    cyan: {
      gradient: "from-cyan-500/8 via-cyan-500/3 to-transparent",
      border: "border-cyan-500/15",
      icon: "text-cyan-500/70",
      spark: "#00bfff",
    },
    orange: {
      gradient: "from-orange-500/8 via-orange-500/3 to-transparent",
      border: "border-orange-500/15",
      icon: "text-orange-500/70",
      spark: "#ff6b00",
    },
    red: {
      gradient: "from-red-500/8 via-red-500/3 to-transparent",
      border: "border-red-500/15",
      icon: "text-red-500/70",
      spark: "#ef4444",
    },
  };

  const points = sparkline ?? [30, 45, 38, 52, 48, 60, 55, 70, 65, 75, 72, 80];
  const trendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendClass =
    trend === "up"
      ? "text-lime-500"
      : trend === "down"
        ? "text-red-400"
        : "text-zinc-600";
  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        "rounded-xl border p-4 bg-gradient-to-br",
        c.gradient,
        c.border,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
            <Icon size={13} className={c.icon} />
            <span>{label}</span>
          </div>
          <div className="mt-1 text-2xl font-black text-white tabular-nums">
            {value}
            {unit ? (
              <span className="ml-1 text-[10px] font-medium text-zinc-500">
                {unit}
              </span>
            ) : null}
          </div>
        </div>
        {trend ? <TrendIcon size={10} className={trendClass} /> : null}
      </div>

      <div className="mt-3 h-6">
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.spark} stopOpacity="0.2" />
              <stop offset="100%" stopColor={c.spark} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 30 ${points
              .map(
                (v, i, arr) =>
                  `L ${(i / (arr.length - 1)) * 100} ${30 - (v / 100) * 28}`,
              )
              .join(" ")} L 100 30 Z`}
            fill={`url(#${sparkId})`}
          />
          <polyline
            points={points
              .map(
                (v, i, arr) =>
                  `${(i / (arr.length - 1)) * 100},${30 - (v / 100) * 28}`,
              )
              .join(" ")}
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
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
        {children}
      </span>
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
export function DashboardView({ telemetry: _telemetry }: { telemetry?: any }) {
    const [currentTime, setCurrentTime] = useState('');
    const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
    const [alerts, setAlerts] = useState<AlertCenterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});

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
        const abortController = new AbortController();

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [dashboard, alertRows] = await Promise.all([
                    fetchDashboardStatus(abortController.signal),
                    fetchDashboardAlerts(undefined, abortController.signal),
                ]);
                setDashboardStatus(dashboard);
                setAlerts(alertRows);
            } catch (fetchError) {
                if (abortController.signal.aborted) {
                    return;
                }
                setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard status');
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
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
        return () => abortController.abort();
    }, [refreshTick]);

    const alertCounts = useMemo(() => {
        const counts: Record<AlertSeverity, number> = { critical: 0, warning: 0, info: 0 };
        for (const alert of alerts) {
            counts[alert.severity] += 1;
        }
        return counts;
    }, [alerts]);

    const activeAlerts = useMemo(() => alerts.filter((item) => !item.acknowledged), [alerts]);

    const handleAcknowledge = async (alertId: string) => {
        const previousAlerts = alerts;
        const nowIso = new Date().toISOString();

        setAckInFlight((prev) => ({ ...prev, [alertId]: true }));
        setAlerts((prev) =>
            prev.map((item) =>
                item.alert_id === alertId
                    ? { ...item, acknowledged: true, acknowledged_at: item.acknowledged_at ?? nowIso }
                    : item
            )
        );

        try {
            const acknowledgedAlert = await acknowledgeDashboardAlert(alertId);
            setAlerts((prev) =>
                prev.map((item) => (item.alert_id === alertId ? acknowledgedAlert : item))
            );
        } catch {
            setAlerts(previousAlerts);
        } finally {
            setAckInFlight((prev) => ({ ...prev, [alertId]: false }));
        }
    };

    const severityTone: Record<AlertSeverity, string> = {
        critical: 'bg-red-500/15 text-red-300 border-red-500/30',
        warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };

    const healthColor =
        dashboardStatus?.service_health.status === 'healthy'
            ? 'lime'
            : dashboardStatus?.service_health.status === 'degraded'
              ? 'orange'
              : 'red';
    const queueColor =
        dashboardStatus?.queue_depth.state === 'critical'
            ? 'red'
            : dashboardStatus?.queue_depth.state === 'warning'
              ? 'orange'
              : 'lime';
    const rotationColor = dashboardStatus?.rotation.is_stale ? 'red' : 'lime';
    const alertCenterColor = activeAlerts.length > 0 ? 'orange' : 'lime';
    const queueSparkline = dashboardStatus?.queue_depth.trend.map((point) => point.depth);

    return (
        <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Station <span className="text-lime-400">Overview</span>
                    </h1>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{status.service_health.reason}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                        Live monitoring {error ? '· Status API degraded' : '· Status API connected'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">{currentTime}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Local Time</div>
                </div>
            </motion.div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setRefreshTick((value) => value + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-300 hover:border-zinc-500"
                >
                    <RefreshCw size={12} /> Refresh status
                </button>
            </div>

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
                <StatCard
                    label="Service Health"
                    value={dashboardStatus?.service_health.status ?? '--'}
                    icon={Activity}
                    color={healthColor}
                    trend="stable"
                />
                <StatCard
                    label="Queue Depth"
                    value={dashboardStatus?.queue_depth.current_depth ?? '--'}
                    unit="items"
                    icon={Gauge}
                    color={queueColor}
                    trend={
                        dashboardStatus?.queue_depth.trend && dashboardStatus.queue_depth.trend.length >= 2
                            ? dashboardStatus.queue_depth.trend[dashboardStatus.queue_depth.trend.length - 1].depth >=
                              dashboardStatus.queue_depth.trend[dashboardStatus.queue_depth.trend.length - 2].depth
                                ? 'up'
                                : 'down'
                            : 'stable'
                    }
                    sparkline={queueSparkline}
                    delay={0.05}
                />
                <StatCard
                    label="Queue Thresholds"
                    value={dashboardStatus ? `${dashboardStatus.queue_depth.thresholds.warning}/${dashboardStatus.queue_depth.thresholds.critical}` : '--'}
                    unit="warn/crit"
                    icon={AlertTriangle}
                    color={queueColor}
                    trend="stable"
                    delay={0.1}
                />
                <StatCard
                    label="Rotation"
                    value={dashboardStatus?.rotation.is_stale ? 'stale' : 'fresh'}
                    icon={Signal}
                    color={rotationColor}
                    trend={dashboardStatus?.rotation.is_stale ? 'down' : 'up'}
                    delay={0.15}
                />
                <StatCard
                    label="Alert Center"
                    value={`${activeAlerts.length}/${alerts.length}`}
                    unit="active/total"
                    icon={CheckCircle2}
                    color={alertCenterColor}
                    trend={activeAlerts.length > 0 ? 'down' : 'up'}
                    delay={0.2}
                />
            </div>

            {loading ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
                    Loading status telemetry…
                </div>
            ) : null}
            {error ? (
                <div className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">
                    Status API unavailable: {error}
                </div>
            ) : null}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">Alert Center</h2>
                    <div className="text-[10px] text-zinc-500">
                        critical {alertCounts.critical} · warning {alertCounts.warning} · info {alertCounts.info}
                    </div>
                </div>
                {alerts.length === 0 ? (
                    <div className="text-xs text-zinc-500">No alerts in timeline.</div>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div
                                key={alert.alert_id}
                                className={cn(
                                    'rounded-lg border border-zinc-800 p-2',
                                    alert.acknowledged && 'opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase', severityTone[alert.severity])}>
                                                {alert.severity}
                                            </span>
                                            <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                                        </div>
                                        <p className="text-xs text-zinc-400">{alert.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={alert.acknowledged || ackInFlight[alert.alert_id]}
                                        onClick={() => void handleAcknowledge(alert.alert_id)}
                                        className="rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

export function DashboardView({ telemetry }: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Station <span className="text-lime-400">Overview</span>
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Live monitoring ·{" "}
            <span
              className={mapSeverityToStatusTextClass(
                telemetry.aiLoad.severity,
              )}
            >
              All systems {telemetry.aiLoad.status}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">
            {currentTime}
          </div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
            {telemetry.localTimeLabel}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard
          label="Uptime"
          value={telemetry.uptime.value}
          unit={telemetry.uptime.unit}
          icon={Activity}
          color={mapSeverityToCardColor(telemetry.uptime.severity)}
          trend={mapStatusToTrend(telemetry.uptime.status)}
          sparkline={telemetry.uptime.sparkline}
        />
        <StatCard
          label="Listeners"
          value={telemetry.listeners.value.toLocaleString()}
          icon={Users}
          color="purple"
          trend={telemetry.listeners.trend}
          sparkline={telemetry.listeners.sparkline}
          delay={0.05}
        />
        <StatCard
          label="Latency"
          value={telemetry.latency.value}
          unit={telemetry.latency.unit}
          icon={Gauge}
          color="cyan"
          trend={telemetry.latency.trend}
          sparkline={telemetry.latency.sparkline}
          delay={0.1}
        />
        <StatCard
          label="Stream"
          value={telemetry.streamBitrate.value}
          unit={telemetry.streamBitrate.unit}
          icon={Wifi}
          color={mapSeverityToCardColor(telemetry.streamBitrate.severity)}
          trend={mapStatusToTrend(telemetry.streamBitrate.status)}
          sparkline={telemetry.streamBitrate.sparkline}
          delay={0.15}
        />
        <StatCard
          label="AI Load"
          value={telemetry.aiLoad.value}
          unit={telemetry.aiLoad.unit}
          icon={Zap}
          color={mapSeverityToCardColor(telemetry.aiLoad.severity)}
          trend={mapStatusToTrend(telemetry.aiLoad.status)}
          sparkline={telemetry.aiLoad.sparkline}
          delay={0.2}
        />
      </div>

      <SectionHeader>Now Playing</SectionHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="glass-panel overflow-hidden">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"
                  style={{ boxShadow: "0 0 8px rgba(170,255,0,0.45)" }}
                />
                <span className="panel-header-title">Master Output</span>
              </div>
              <div className="flex items-center gap-2">
                <Signal size={10} className="text-lime-500" />
                <span className="text-[9px] font-mono text-zinc-500">
                  AAC 320k
                </span>
              </div>
            </div>
            <div className="p-3">
              <DegenWaveform
                progress={0.42}
                duration={234}
                trackTitle="Neural Drift v2.1 - SynthKong"
                isPlaying
                cuePoints={[
                  { position: 0.12, label: "CUE 1", color: "#ff6b00" },
                  { position: 0.68, label: "DROP", color: "#bf00ff" },
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
            { key: "reverb", label: "Reverb", unit: "%" },
            { key: "comp", label: "Comp", unit: "dB", max: 30 },
            { key: "rate", label: "Rate", unit: "Hz", max: 20 },
            { key: "limit", label: "Limiter", unit: "dB", max: 0 },
            { key: "width", label: "Stereo", unit: "%" },
          ]}
        />
      </div>
    </div>
  );
}

export { deriveQueueSeverity };
