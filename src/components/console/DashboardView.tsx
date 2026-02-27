"use client";

import { useEffect, useId, useMemo, useRef, useState, type ElementType } from "react";
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
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenBeatGrid } from "@/components/audio/DegenBeatGrid";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
import { cn } from "@/lib/utils";
import {
  type DashboardCardColor,
  mapSeverityToCardColor,
  mapSeverityToStatusTextClass,
  mapStatusToTrend,
} from "./dashboard.types";
import {
    acknowledgeDashboardAlert,
    fetchDashboardAlerts,
    fetchDashboardStatus,
    type AlertCenterItem,
    type AlertSeverity,
    type DashboardStatusResponse,
} from '@/lib/status/dashboardClient';

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

function deriveQueueSeverity(currentDepth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
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

export function DashboardView({ telemetry }: { telemetry?: any }) {
    const [currentTime, setCurrentTime] = useState('');
    const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
    const [alerts, setAlerts] = useState<AlertCenterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});
    const inFlightAlertIdsRef = useRef(new Set<string>());
    const previousAlertByIdRef = useRef<Record<string, AlertCenterItem | undefined>>({});

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
        const abortController = new AbortController();

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [dashboard, alertRows] = await Promise.all([
                    fetchDashboardStatus(abortController.signal),
                    fetchDashboardAlerts(undefined, abortController.signal),
                ]);
                if (mounted) {
                    setDashboardStatus(dashboard);
                    setAlerts(alertRows);
                }
            } catch (fetchError) {
                if (abortController.signal.aborted) return;
                if (mounted) {
                    setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard status');
                }
            } finally {
                if (mounted && !abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            mounted = false;
            abortController.abort();
        };
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
        if (inFlightAlertIdsRef.current.has(alertId)) {
            return;
        }

        inFlightAlertIdsRef.current.add(alertId);
        const nowIso = new Date().toISOString();

        setAckInFlight((prev) => ({ ...prev, [alertId]: true }));
        setAlerts((prev) =>
            prev.map((item) => {
                if (item.alert_id !== alertId) {
                    return item;
                }

                previousAlertByIdRef.current[alertId] = item;
                return {
                    ...item,
                    acknowledged: true,
                    acknowledged_at: item.acknowledged_at ?? nowIso,
                };
            })
        );

        try {
            const acknowledgedAlert = await acknowledgeDashboardAlert(alertId);
            setAlerts((prev) =>
                prev.map((item) => (item.alert_id === alertId ? acknowledgedAlert : item))
            );
        } catch {
            const previousAlert = previousAlertByIdRef.current[alertId];
            if (previousAlert) {
                setAlerts((prev) =>
                    prev.map((item) => (item.alert_id === alertId ? previousAlert : item))
                );
            }
        } finally {
            delete previousAlertByIdRef.current[alertId];
            inFlightAlertIdsRef.current.delete(alertId);
            setAckInFlight((prev) => {
                if (!prev[alertId]) {
                    return prev;
                }
                const next = { ...prev };
                delete next[alertId];
                return next;
            });
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
    const queueSeverity = dashboardStatus
        ? deriveQueueSeverity(dashboardStatus.queue_depth.current_depth, dashboardStatus.queue_depth.thresholds)
        : 'info';

    const queueColor =
        queueSeverity === 'critical'
            ? 'red'
            : queueSeverity === 'warning'
              ? 'orange'
              : 'lime';
    const rotationColor = dashboardStatus?.rotation.is_stale ? 'red' : 'lime';
    const alertCenterColor = activeAlerts.length > 0 ? 'orange' : 'lime';
    const queueSparkline = dashboardStatus?.queue_depth.trend.map((point) => point.depth);
    const statusCardsHeadingId = 'dashboard-status-cards-heading';
    const alertCenterHeadingId = 'dashboard-alert-center-heading';
    const nowPlayingHeadingId = 'dashboard-now-playing-heading';
    const audioEngineHeadingId = 'dashboard-audio-engine-heading';

    return (
        <main className="space-y-5" aria-labelledby="dashboard-overview-heading">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
                <div>
                    <h1 id="dashboard-overview-heading" className="text-2xl font-black tracking-tight text-white">
                        Station <span className="text-lime-400">Overview</span>
                    </h1>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                        {dashboardStatus?.service_health.reason || 'Initializing...'}
                    </p>
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

            <section
                aria-labelledby={statusCardsHeadingId}
                className="space-y-3"
                tabIndex={0}
            >
                <h2 id={statusCardsHeadingId} className="sr-only">Status cards</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
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
            </section>

            {loading ? (
                <div role="status" aria-live="polite" aria-atomic="true" className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
                    Loading status telemetry…
                </div>
            ) : null}
            {error ? (
                <div role="alert" aria-live="assertive" aria-atomic="true" className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">
                    Status API unavailable: {error}
                </div>
            ) : null}

            <section aria-labelledby={alertCenterHeadingId} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h2 id={alertCenterHeadingId} className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">Alert Center</h2>
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
                                        {alert.acknowledged && (
                                            <p className="text-[10px] text-zinc-500">
                                                Ack at: {formatTimestamp(alert.acknowledged_at)}
                                            </p>
                                        )}
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
            </section>

            <SectionHeader>Now Playing</SectionHeader>
            <section aria-labelledby={nowPlayingHeadingId} className="space-y-4">
                <h2 id={nowPlayingHeadingId} className="sr-only">Now playing</h2>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                    <div className="glass-panel overflow-hidden">
                        <div className="panel-header">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"
                                    style={{ boxShadow: '0 0 8px rgba(170,255,0,0.45)' }}
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
            </section>

            <SectionHeader>Audio Engine</SectionHeader>
            <section aria-labelledby={audioEngineHeadingId} className="space-y-4">
                <h2 id={audioEngineHeadingId} className="sr-only">Audio engine</h2>
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
            </section>
        </main>
    );
}
