"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Gauge, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Minus,
  Signal,
  TrendingDown,
  TrendingUp,
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
} from "@/lib/status/dashboardClient";
import { cn } from "@/lib/utils";
import { mapSeverityToStatusTextClass } from "./dashboard.types";

const CLOCK_INTERVAL_MS = 1_000;
const DEFAULT_POLL_MS = 5_000;
const DEFAULT_HIDDEN_POLL_MS = 30_000;
const MAX_BACKOFF_MS = 60_000;
const JITTER_FACTOR = 0.3;
import {
  createNotificationsState,
  getFilteredNotificationAlerts,
  setNotificationAlerts,
  toggleNotificationSeverity,
} from "@/features/notifications/notifications.store";
import { mapSeverityToCardColor, mapSeverityToStatusTextClass } from "./dashboard.types";

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (severity?: AlertSeverity, signal?: AbortSignal) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) => Promise<AlertCenterItem>;
}

interface DashboardViewProps {
  api?: DashboardViewApi;

export interface DashboardViewApi {
  fetchDashboardStatus: (
    signal?: AbortSignal,
  ) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (
    severity?: AlertSeverity,
    signal?: AbortSignal,
  ) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (
    alertId: string,
    signal?: AbortSignal,
  ) => Promise<AlertCenterItem>;
}

interface DashboardViewProps {
  telemetry?: unknown;
  api?: DashboardViewApi;
  pollIntervalMs?: number;
  hiddenPollIntervalMs?: number;
}

const defaultDashboardViewApi: DashboardViewApi = {
  fetchDashboardStatus,
  fetchDashboardAlerts,
  acknowledgeDashboardAlert,
};

const severityTone: Record<AlertSeverity, string> = {
  critical: "border-red-500/40 text-red-300",
  warning: "border-orange-500/40 text-orange-300",
  info: "border-lime-500/40 text-lime-300",
};

function deriveQueueSeverity(currentDepth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
  if (currentDepth >= thresholds.critical) return "critical";
  if (currentDepth >= thresholds.warning) return "warning";
function deriveQueueSeverity(
  currentDepth: number,
  thresholds: { warning: number; critical: number },
): AlertSeverity {
  if (currentDepth >= thresholds.critical) {
    return "critical";
  }
  if (currentDepth >= thresholds.warning) {
    return "warning";
  }
  return "info";
}

function isAlertSeverity(value: unknown): value is AlertSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

export function resolveQueueDepthSeverity(queueDepth: DashboardStatusResponse["queue_depth"]): AlertSeverity {
  if (isAlertSeverity(queueDepth.state)) {
    return queueDepth.state;
  }

  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";
  return new Date(timestamp).toLocaleString();
}

function formatFreshnessMinutes(value: string | null): string {
  if (!value) return "Updated —";
  const observedAt = new Date(value).getTime();
  if (Number.isNaN(observedAt)) return "Updated —";
  return `Updated ${Math.max(0, Math.floor((Date.now() - observedAt) / 60_000))} min ago`;
}

export function DashboardView({ api = defaultDashboardViewApi }: DashboardViewProps) {
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
  const [notifications, setNotifications] = useState(createNotificationsState());
export function resolveQueueDepthSeverity(
  queueDepth: DashboardStatusResponse["queue_depth"],
): AlertSeverity {
  if (isAlertSeverity(queueDepth.state)) {
    return queueDepth.state;
  }
  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

function formatClock(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

function withVisibilityDelay(baseDelay: number, hiddenPollIntervalMs: number): number {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return Math.max(baseDelay, hiddenPollIntervalMs);
  }
  return baseDelay;
}

function nextBackoffDelay(basePollMs: number, failureCount: number): number {
  const exponential = Math.min(MAX_BACKOFF_MS, basePollMs * 2 ** Math.max(0, failureCount - 1));
  const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(exponential * JITTER_FACTOR)));
  return exponential + jitter;
}

export function DashboardView({
  telemetry: _telemetry,
  api = defaultDashboardViewApi,
  pollIntervalMs = DEFAULT_POLL_MS,
  hiddenPollIntervalMs = DEFAULT_HIDDEN_POLL_MS,
}: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState(formatClock);
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const failureCountRef = useRef(0);

  const queueSeverity = useMemo(
    () => (dashboardStatus ? resolveQueueDepthSeverity(dashboardStatus.queue_depth) : "info"),
    [dashboardStatus],
  );

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedulePollRef = useRef<(delayMs: number) => void>(() => undefined);

  const runPoll = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const [status, nextAlerts] = await Promise.all([
        api.fetchDashboardStatus(controller.signal),
        api.fetchDashboardAlerts(undefined, controller.signal),
      ]);
      setDashboardStatus(status);
      setAlerts(nextAlerts.length > 0 ? nextAlerts : status.alert_center.items);
      setError(null);
      setLoading(false);
      failureCountRef.current = 0;
      schedulePollRef.current(pollIntervalMs);
    } catch (fetchError) {
      if (controller.signal.aborted) {
        return;
      }
      setLoading(false);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard status");
      failureCountRef.current += 1;
      schedulePollRef.current(nextBackoffDelay(pollIntervalMs, failureCountRef.current));
    } finally {
      inFlightRef.current = false;
    }
  }, [api, clearTimer, hiddenPollIntervalMs, pollIntervalMs]);

  useEffect(() => {
    const tickClock = () => setCurrentTime(formatClock());
    const timer = setInterval(tickClock, CLOCK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    schedulePollRef.current = (delayMs: number) => {
      clearTimer();
      timeoutRef.current = setTimeout(
        () => void runPoll(),
        withVisibilityDelay(delayMs, hiddenPollIntervalMs),
      );
    };

    void runPoll();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runPoll();
        return;
      }

      if (!inFlightRef.current) {
        schedulePollRef.current(hiddenPollIntervalMs);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimer();
      abortRef.current?.abort();
    };
  }, [clearTimer, runPoll]);

  const acknowledge = async (alertId: string) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.alert_id === alertId
          ? { ...alert, acknowledged: true, acknowledged_at: alert.acknowledged_at ?? now }
          : alert,
      ),
    );

    try {
      const updated = await api.acknowledgeDashboardAlert(alertId);
      setAlerts((prev) => prev.map((alert) => (alert.alert_id === alertId ? updated : alert)));
    } catch {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.alert_id === alertId ? { ...alert, acknowledged: false, acknowledged_at: null } : alert,
        ),
      );
    }
  };

  return (
    <section className="space-y-3" aria-label="Dashboard">
      <header className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="text-xs text-zinc-400">Studio clock</div>
        <div className="font-mono text-lg text-white">{currentTime}</div>
      </header>

      {loading ? <div role="status">Loading dashboard status…</div> : null}
      {error ? <div role="alert">Status API unavailable: {error}</div> : null}

      {dashboardStatus ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-200">
          Queue state:{" "}
          <span data-testid="queue-depth-state" className={cn("font-semibold uppercase", mapSeverityToStatusTextClass(queueSeverity))}>
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - observedAt) / 60_000),
  );
  return `Updated ${elapsedMinutes} min ago`;
}

interface DashboardViewProps {
  telemetry?: unknown;
  api?: DashboardViewApi;
}

export function DashboardView({
  telemetry,
  api = defaultDashboardViewApi,
}: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [dashboardStatus, setDashboardStatus] =
    useState<DashboardStatusResponse | null>(null);
  const [notifications, setNotifications] = useState(
    createNotificationsState(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});
  const inFlightAlertIdsRef = useRef(new Set<string>());
  const previousAlertByIdRef = useRef<Record<string, AlertCenterItem | undefined>>({});
  const previousAlertByIdRef = useRef<
    Record<string, AlertCenterItem | undefined>
  >({});

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

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dashboard, alertRows] = await Promise.all([
          api.fetchDashboardStatus(abortController.signal),
          api.fetchDashboardAlerts(undefined, abortController.signal),
        ]);
        if (mounted) {
          setDashboardStatus(dashboard);
          setNotifications(
            setNotificationAlerts(
              createNotificationsState(dashboard.alert_center),
              alertRows,
            ),
          );
        }
      } catch (fetchError) {
        if (abortController.signal.aborted) return;
        if (mounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load dashboard status",
          );
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
  }, [api, refreshTick]);

  const alertCounts = useMemo(() => {
    const counts: Record<AlertSeverity, number> = { critical: 0, warning: 0, info: 0 };
    for (const alert of notifications.alerts) {
      counts[alert.severity] += 1;
    }
    return counts;
  }, [notifications.alerts]);

  const filteredAlerts = useMemo(() => getFilteredNotificationAlerts(notifications), [notifications]);

  const handleAcknowledge = async (alertId: string) => {
    if (inFlightAlertIdsRef.current.has(alertId)) return;

    inFlightAlertIdsRef.current.add(alertId);
    const nowIso = new Date().toISOString();

    setAckInFlight((prev) => ({ ...prev, [alertId]: true }));
    setNotifications((prev) =>
      setNotificationAlerts(
        prev,
        prev.alerts.map((item) => {
          if (item.alert_id !== alertId) return item;
          previousAlertByIdRef.current[alertId] = item;
          return { ...item, acknowledged: true, acknowledged_at: item.acknowledged_at ?? nowIso };
        })
      )
    );

    try {
      const acknowledgedAlert = await api.acknowledgeDashboardAlert(alertId);
      setNotifications((prev) =>
        setNotificationAlerts(prev, prev.alerts.map((item) => (item.alert_id === alertId ? acknowledgedAlert : item)))
      );
    } catch {
      const previousAlert = previousAlertByIdRef.current[alertId];
      if (previousAlert) {
        setNotifications((prev) =>
          setNotificationAlerts(prev, prev.alerts.map((item) => (item.alert_id === alertId ? previousAlert : item)))
        );
      }
    } finally {
      delete previousAlertByIdRef.current[alertId];
      inFlightAlertIdsRef.current.delete(alertId);
      setAckInFlight((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  };

  const queueSeverity = dashboardStatus ? resolveQueueDepthSeverity(dashboardStatus.queue_depth) : "info";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Dashboard</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
          onClick={() => setRefreshTick((prev) => prev + 1)}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? <div className="text-xs text-zinc-500">Loading status telemetry…</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">Status API unavailable: {error}</div> : null}

      {dashboardStatus ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">Service Health</div>
              <div className={cn("mt-2 text-sm font-semibold", mapSeverityToStatusTextClass(queueSeverity))}>{dashboardStatus.service_health.reason}</div>
              <div className="mt-1 text-[10px] text-zinc-500" data-testid="service-health-freshness">{formatFreshnessMinutes(dashboardStatus.service_health.observed_at)}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">Queue Depth</div>
              <div className="mt-2 text-2xl font-bold text-zinc-100">{dashboardStatus.queue_depth.current_depth}</div>
              <div className="text-[10px] text-zinc-500" data-testid="queue-depth-state">{queueSeverity}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3" data-testid="queue-depth-threshold-markers">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">Queue Thresholds</div>
              <div className="mt-2 text-sm text-zinc-100">{dashboardStatus.queue_depth.thresholds.warning}/{dashboardStatus.queue_depth.thresholds.critical}</div>
              <div className="mt-1 flex gap-2 text-[10px]">
                <span data-testid="queue-warning-marker">warning: {dashboardStatus.queue_depth.thresholds.warning}</span>
                <span data-testid="queue-critical-marker">critical: {dashboardStatus.queue_depth.thresholds.critical}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">Alert Center</h3>
              <div className="text-[10px] text-zinc-500">
                <span data-testid="severity-count-critical">Critical: {alertCounts.critical}</span> · <span data-testid="severity-count-warning">Warning: {alertCounts.warning}</span> · <span data-testid="severity-count-info">Info: {alertCounts.info}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {dashboardStatus.alert_center.filters.map((severity) => {
                const selected = notifications.selectedSeverities.includes(severity);
                return (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => setNotifications((prev) => toggleNotificationSeverity(prev, severity))}
                    className={cn("rounded-full border px-2 py-1 text-[10px] uppercase", selected ? severityTone[severity] : "border-zinc-700 text-zinc-500")}
                  >
                    {severity}
                  </button>
                );
              })}
            </div>
            {filteredAlerts.length === 0 ? (
              <div className="text-xs text-zinc-500">No alerts in timeline.</div>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <div key={alert.alert_id} className={cn("rounded-lg border border-zinc-800 p-2", alert.acknowledged && "opacity-60")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase", severityTone[alert.severity])}>{alert.severity}</span>
                          <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                        </div>
                        <p className="text-xs text-zinc-400">{alert.description}</p>
                        {alert.acknowledged ? <p data-testid={`alert-ack-${alert.alert_id}`} className="text-[10px] text-zinc-500">Ack at: {formatTimestamp(alert.acknowledged_at)}</p> : null}
                      </div>
                      <button
                        type="button"
                        disabled={alert.acknowledged || ackInFlight[alert.alert_id]}
                        onClick={() => void handleAcknowledge(alert.alert_id)}
                        className="rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2"><DegenWaveform /></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2"><DegenBeatGrid /></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2"><DegenEffectRack /></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2"><DegenScheduleTimeline /></div>
      </section>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2"><DegenAIHost /></div>
      <div className="hidden">
        <Activity />
        <Gauge />
        <AlertTriangle />
        <CheckCircle2 className={mapSeverityToCardColor(queueSeverity)} />
      </div>
    </div>

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [api, refreshTick]);

  const alertCounts = useMemo(() => {
    const counts: Record<AlertSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };
    for (const alert of notifications.alerts) {
      counts[alert.severity] += 1;
    }
    return counts;
  }, [notifications.alerts]);

  const filteredAlerts = useMemo(
    () => getFilteredNotificationAlerts(notifications),
    [notifications],
  );
  const activeAlerts = useMemo(
    () => notifications.alerts.filter((item) => !item.acknowledged),
    [notifications.alerts],
  );

  const handleAcknowledge = async (alertId: string) => {
    if (inFlightAlertIdsRef.current.has(alertId)) {
      return;
    }

    inFlightAlertIdsRef.current.add(alertId);
    const previousAlerts = notifications.alerts;
    const nowIso = new Date().toISOString();

    setAckInFlight((prev) => ({ ...prev, [alertId]: true }));
    setNotifications((prev) =>
      setNotificationAlerts(
        prev,
        prev.alerts.map((item) =>
          item.alert_id === alertId
            ? {
                ...item,
                acknowledged: true,
                acknowledged_at: item.acknowledged_at ?? nowIso,
              }
            : item,
        ),
      ),
    );

    try {
      const acknowledgedAlert = await api.acknowledgeDashboardAlert(alertId);
      setNotifications((prev) =>
        setNotificationAlerts(
          prev,
          prev.alerts.map((item) =>
            item.alert_id === alertId ? acknowledgedAlert : item,
          ),
        ),
      );
    } catch {
      setNotifications((prev) => setNotificationAlerts(prev, previousAlerts));
    } finally {
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
    critical: "bg-red-500/15 text-red-300 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    info: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  };

  const healthColor =
    dashboardStatus?.service_health.status === "healthy"
      ? "lime"
      : dashboardStatus?.service_health.status === "degraded"
        ? "orange"
        : "red";
  const queueSeverity = dashboardStatus
    ? resolveQueueDepthSeverity(dashboardStatus.queue_depth)
    : "info";

  const queueColor =
    queueSeverity === "critical"
      ? "red"
      : queueSeverity === "warning"
        ? "orange"
        : "lime";
  const rotationColor = dashboardStatus?.rotation.is_stale ? "red" : "lime";
  const alertCenterColor = activeAlerts.length > 0 ? "orange" : "lime";
  const queueSparkline = dashboardStatus?.queue_depth.trend.map(
    (point) => point.depth,
  );
  const queueScaleMax = dashboardStatus
    ? Math.max(
        dashboardStatus.queue_depth.current_depth,
        dashboardStatus.queue_depth.thresholds.warning,
        dashboardStatus.queue_depth.thresholds.critical,
        ...dashboardStatus.queue_depth.trend.map((item) => item.depth),
        1,
      )
    : 1;
  const warningMarkerLeft = dashboardStatus
    ? (dashboardStatus.queue_depth.thresholds.warning / queueScaleMax) * 100
    : 0;
  const criticalMarkerLeft = dashboardStatus
    ? (dashboardStatus.queue_depth.thresholds.critical / queueScaleMax) * 100
    : 0;
  const statusCardsHeadingId = "dashboard-status-cards-heading";
  const alertCenterHeadingId = "dashboard-alert-center-heading";
  const nowPlayingHeadingId = "dashboard-now-playing-heading";
  const audioEngineHeadingId = "dashboard-audio-engine-heading";

  return (
    <main className="space-y-5" aria-labelledby="dashboard-overview-heading">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1
            id="dashboard-overview-heading"
            className="text-2xl font-black tracking-tight text-white"
          >
            Station <span className="text-lime-400">Overview</span>
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {dashboardStatus?.service_health.reason || "Initializing..."}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Live monitoring{" "}
            {error ? "· Status API degraded" : "· Status API connected"}
          </p>
          <p
            className="text-[11px] text-zinc-500 mt-0.5"
            data-testid="service-health-freshness"
          >
            {formatFreshnessMinutes(
              dashboardStatus?.service_health.observed_at ?? null,
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">
            {currentTime}
          </div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
            Local Time
          </div>
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
        <h2 id={statusCardsHeadingId} className="sr-only">
          Status cards
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <StatCard
            label="Service Health"
            value={
              dashboardStatus?.service_health.status
                ? dashboardStatus.service_health.status.toUpperCase()
                : "--"
            }
            icon={Activity}
            color={healthColor}
            trend="stable"
          />
          <StatCard
            label="Queue Depth"
            value={dashboardStatus?.queue_depth.current_depth ?? "--"}
            unit="items"
            icon={Gauge}
            color={queueColor}
            trend={
              dashboardStatus?.queue_depth.trend &&
              dashboardStatus.queue_depth.trend.length >= 2
                ? dashboardStatus.queue_depth.trend[
                    dashboardStatus.queue_depth.trend.length - 1
                  ].depth >=
                  dashboardStatus.queue_depth.trend[
                    dashboardStatus.queue_depth.trend.length - 2
                  ].depth
                  ? "up"
                  : "down"
                : "stable"
            }
            sparkline={queueSparkline}
            delay={0.05}
          />
          <StatCard
            label="Warning Threshold"
            value={
              dashboardStatus
                ? dashboardStatus.queue_depth.thresholds.warning
                : "--"
            }
            unit="items"
            icon={AlertTriangle}
            color={queueColor}
            trend="stable"
            delay={0.1}
          />
          <StatCard
            label="Critical Threshold"
            value={
              dashboardStatus
                ? dashboardStatus.queue_depth.thresholds.critical
                : "--"
            }
            unit="items"
            icon={AlertTriangle}
            color={queueColor}
            trend="stable"
            delay={0.15}
          />
          <StatCard
            label="Rotation"
            value={dashboardStatus?.rotation.is_stale ? "stale" : "fresh"}
            icon={Signal}
            color={rotationColor}
            trend={dashboardStatus?.rotation.is_stale ? "down" : "up"}
            delay={0.2}
          />
          <StatCard
            label="Alert Center"
            value={`${activeAlerts.length}/${notifications.alerts.length}`}
            unit="active/total"
            icon={CheckCircle2}
            color={alertCenterColor}
            trend={activeAlerts.length > 0 ? "down" : "up"}
            delay={0.25}
          />
        </div>
      </section>

      {dashboardStatus ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-400">
          Queue state:{" "}
          <span
            data-testid="queue-depth-state"
            className={cn(
              "font-semibold uppercase",
              mapSeverityToStatusTextClass(queueSeverity),
            )}
          >
            {queueSeverity}
          </span>
        </div>
      ) : null}

      <section aria-label="Alert Center" className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.alert_id} className="rounded-lg border border-zinc-800 p-2">
              <div className="font-semibold">{alert.title}</div>
              <button
                type="button"
                onClick={() => void acknowledge(alert.alert_id)}
                disabled={alert.acknowledged}
              >
                {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
      {dashboardStatus ? (
        <div
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
          data-testid="queue-depth-threshold-markers"
        >
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
            <span>Queue threshold markers</span>
            <span>{dashboardStatus.queue_depth.current_depth} current</span>
          </div>
          <div className="relative h-2 rounded bg-zinc-800">
            <div
              className="absolute inset-y-0 left-0 rounded bg-lime-500/40"
              style={{
                width: `${(dashboardStatus.queue_depth.current_depth / queueScaleMax) * 100}%`,
              }}
            />
            <div
              className="absolute inset-y-[-4px] w-px bg-amber-400"
              style={{ left: `${warningMarkerLeft}%` }}
              data-testid="queue-warning-marker"
            />
            <div
              className="absolute inset-y-[-4px] w-px bg-red-400"
              style={{ left: `${criticalMarkerLeft}%` }}
              data-testid="queue-critical-marker"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
            <span>
              Warning {dashboardStatus.queue_depth.thresholds.warning}
            </span>
            <span>
              Critical {dashboardStatus.queue_depth.thresholds.critical}
            </span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400"
          role="status"
          aria-live="polite"
        >
          Loading dashboard status…
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200"
        >
          Status API unavailable: {error}
        </div>
      ) : null}

      <section
        aria-labelledby={alertCenterHeadingId}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2"
      >
        <div className="flex items-center justify-between">
          <h2
            id={alertCenterHeadingId}
            className="text-xs font-semibold tracking-wide text-zinc-300 uppercase"
          >
            Alert Center
          </h2>
          <div className="text-[10px] text-zinc-500">
            <span data-testid="severity-count-critical">
              Critical: {alertCounts.critical}
            </span>{" "}
            ·{" "}
            <span data-testid="severity-count-warning">
              Warning: {alertCounts.warning}
            </span>{" "}
            ·{" "}
            <span data-testid="severity-count-info">
              Info: {alertCounts.info}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dashboardStatus?.alert_center.filters.map((severity) => {
            const selected =
              notifications.selectedSeverities.includes(severity);
            return (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  setNotifications((prev) =>
                    toggleNotificationSeverity(prev, severity),
                  )
                }
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] uppercase",
                  selected
                    ? severityTone[severity]
                    : "border-zinc-700 text-zinc-500",
                )}
              >
                {severity}
              </button>
            );
          })}
        </div>
        {filteredAlerts.length === 0 ? (
          <div className="text-xs text-zinc-500">No alerts in timeline.</div>
        ) : (
          <div className="space-y-2">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={cn(
                  "rounded-lg border border-zinc-800 p-2",
                  alert.acknowledged && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] uppercase",
                          severityTone[alert.severity],
                        )}
                      >
                        {alert.severity}
                      </span>
                      <p className="text-sm font-medium text-zinc-100">
                        {alert.title}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400">{alert.description}</p>
                    {alert.acknowledged && (
                      <p
                        data-testid={`alert-ack-${alert.alert_id}`}
                        className="text-[10px] text-zinc-500"
                      >
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
                    {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SectionHeader>Now Playing</SectionHeader>
      <section aria-labelledby={nowPlayingHeadingId} className="space-y-4">
        <h2 id={nowPlayingHeadingId} className="sr-only">
          Now playing
        </h2>
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
      </section>

      <SectionHeader>Audio Engine</SectionHeader>
      <section aria-labelledby={audioEngineHeadingId} className="space-y-4">
        <h2 id={audioEngineHeadingId} className="sr-only">
          Audio engine
        </h2>
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
      </section>
    </main>
  );
}
