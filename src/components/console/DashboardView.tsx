"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Gauge, RefreshCw, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  acknowledgeDashboardAlert,
  fetchDashboardAlerts,
  fetchDashboardStatus,
  type AlertCenterItem,
  type AlertSeverity,
  type DashboardStatusResponse,
} from "@/lib/status/dashboardClient";
import {
  createNotificationsState,
  getFilteredNotificationAlerts,
  setNotificationAlerts,
  toggleNotificationSeverity,
} from "@/features/notifications/notifications.store";
import {
  type DashboardCardColor,
  mapSeverityToCardColor,
  mapSeverityToStatusTextClass,
} from "./dashboard.types";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;
import { mapSeverityToCardColor, mapSeverityToStatusTextClass, mapStatusToTrend, type DashboardCardColor, type DashboardTrend } from "./dashboard.types";

export interface DashboardTelemetryFallback {
  serviceHealthStatus: DashboardStatusResponse["service_health"]["status"];
  queueDepth: number;
  warningThreshold: number;
  criticalThreshold: number;
  activeAlerts: number;
  totalAlerts: number;
import { useEffect, useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Gauge, Minus, RefreshCw, Signal, TrendingDown, TrendingUp } from "lucide-react";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
import { DegenBeatGrid } from "@/components/audio/DegenBeatGrid";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import { createNotificationsState, getFilteredNotificationAlerts, setNotificationAlerts, toggleNotificationSeverity } from "@/features/notifications/notifications.store";
import { acknowledgeDashboardAlert, fetchDashboardAlerts, fetchDashboardStatus, type AlertCenterItem, type AlertSeverity, type DashboardStatusResponse } from "@/lib/status/dashboardClient";
import { cn } from "@/lib/utils";
import { mapSeverityToCardColor, mapSeverityToStatusTextClass, mapStatusToTrend, type DashboardCardColor } from "./dashboard.types";

export interface DashboardTelemetryDTO {
  serviceHealth?: {
    observedAt?: string | null;
  };
  queueDepth?: {
    currentDepth?: number;
    state?: AlertSeverity;
  };
}

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (severity?: AlertSeverity, signal?: AbortSignal) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) => Promise<AlertCenterItem>;
}

export interface DashboardViewProps {
  api?: Partial<DashboardViewApi>;
  pollIntervalMs?: number;
}

const defaultApi: DashboardViewApi = {
interface DashboardViewProps {
  telemetry?: DashboardTelemetryFallback | null;
  telemetry?: DashboardTelemetryDTO;
  api?: DashboardViewApi;
}

const defaultDashboardViewApi: DashboardViewApi = {
  fetchDashboardStatus,
  fetchDashboardAlerts,
  acknowledgeDashboardAlert,
};

function buildApi(api?: Partial<DashboardViewApi>): DashboardViewApi {
  return {
    ...defaultApi,
    ...api,
  };
}

function isAlertSeverity(value: unknown): value is AlertSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

function deriveQueueSeverity(currentDepth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
  if (currentDepth >= thresholds.critical) {
    return "critical";
  }
  if (currentDepth >= thresholds.warning) {
    return "warning";
  }
  return "info";
}

export function resolveQueueDepthSeverity(
  queueDepth: DashboardStatusResponse["queue_depth"],
): AlertSeverity {
  if (isAlertSeverity(queueDepth.state)) {
    return queueDepth.state;
  }
  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

export function DashboardView({ api, pollIntervalMs = POLL_INTERVAL_MS }: DashboardViewProps) {
  const dashboardApi = useMemo(() => buildApi(api), [api]);
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
  const [notifications, setNotifications] = useState(createNotificationsState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const inFlightAlertIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, pollIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [pollIntervalMs]);

  useEffect(() => {
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ElementType;
  color?: DashboardCardColor;
  trend?: "up" | "down" | "stable";
}

function StatCard({ label, value, unit, icon: Icon, color = "lime", trend = "stable" }: StatCardProps) {
  const trendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const palette = {
    lime: "border-lime-500/15 text-lime-500/70",
    purple: "border-purple-500/15 text-purple-500/70",
    cyan: "border-cyan-500/15 text-cyan-500/70",
    orange: "border-orange-500/15 text-orange-500/70",
    red: "border-red-500/15 text-red-500/70",
  }[color];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-xl border p-4 bg-zinc-900/40", palette)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
            <Icon size={13} />
            <span>{label}</span>
          </div>
          <div className="mt-1 text-2xl font-black text-white tabular-nums">
            {value}
            {unit ? <span className="ml-1 text-[10px] font-medium text-zinc-500">{unit}</span> : null}
          </div>
        </div>
        <TrendIcon size={10} className={trend === "up" ? "text-lime-500" : trend === "down" ? "text-red-400" : "text-zinc-600"} />
      </div>
    </motion.div>
  );
}

function deriveQueueSeverity(currentDepth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
  if (currentDepth >= thresholds.critical) return "critical";
  if (currentDepth >= thresholds.warning) return "warning";
  return "info";
}

function isAlertSeverity(value: unknown): value is AlertSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

export function resolveQueueDepthSeverity(queueDepth: DashboardStatusResponse["queue_depth"]): AlertSeverity {
  if (isAlertSeverity(queueDepth.state)) return queueDepth.state;
  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

export function parseDashboardTelemetryFallback(input: unknown): DashboardTelemetryFallback | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<DashboardTelemetryFallback>;
  const healthOk = candidate.serviceHealthStatus === "healthy" || candidate.serviceHealthStatus === "degraded" || candidate.serviceHealthStatus === "offline";
  const numeric = [candidate.queueDepth, candidate.warningThreshold, candidate.criticalThreshold, candidate.activeAlerts, candidate.totalAlerts].every(
    (value) => typeof value === "number" && Number.isFinite(value)
  );
  if (!healthOk || !numeric) return null;
  return {
    serviceHealthStatus: candidate.serviceHealthStatus!,
    queueDepth: candidate.queueDepth!,
    warningThreshold: candidate.warningThreshold!,
    criticalThreshold: candidate.criticalThreshold!,
    activeAlerts: candidate.activeAlerts!,
    totalAlerts: candidate.totalAlerts!,
  };
}

function StatCard({ label, value, icon: Icon, color, trend }: { label: string; value: string; icon: typeof Activity; color: DashboardCardColor; trend: DashboardTrend }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1"><Icon size={12} /> {label}</span>
        <span className={cn("font-semibold", color === "red" ? "text-red-400" : color === "orange" ? "text-orange-400" : "text-lime-400")}>{trend}</span>
      </div>
      <p className="text-xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export function DashboardView({ telemetry, api = defaultDashboardViewApi }: DashboardViewProps) {
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertCenterItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
function formatFreshnessMinutes(value: string | null): string {
  if (!value) return "Updated —";
  const observedAt = new Date(value).getTime();
  if (Number.isNaN(observedAt)) return "Updated —";
  return `Updated ${Math.max(0, Math.floor((Date.now() - observedAt) / 60_000))} min ago`;
}

export function DashboardView({ telemetry: _telemetry, api = defaultDashboardViewApi }: DashboardViewProps) {
  const [status, setStatus] = useState<DashboardStatusResponse | null>(null);
  const [notifications, setNotifications] = useState(createNotificationsState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [status, alerts] = await Promise.all([
          dashboardApi.fetchDashboardStatus(abortController.signal),
          dashboardApi.fetchDashboardAlerts(undefined, abortController.signal),
        ]);

        setDashboardStatus(status);
        setNotifications(
          setNotificationAlerts(createNotificationsState(status.alert_center), alerts),
        );
      } catch (loadError) {
        if (abortController.signal.aborted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard status",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      try {
        const [status, alertItems] = await Promise.all([
          api.fetchDashboardStatus(controller.signal),
          api.fetchDashboardAlerts(undefined, controller.signal),
        ]);
        setDashboardStatus(status);
        setAlerts(alertItems.length > 0 ? alertItems : status.alert_center.items);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard status");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
        const [dashboard, alertRows] = await Promise.all([
          api.fetchDashboardStatus(abortController.signal),
          api.fetchDashboardAlerts(undefined, abortController.signal),
        ]);
        if (!mounted) return;
        setStatus(dashboard);
        setNotifications(setNotificationAlerts(createNotificationsState(dashboard.alert_center), alertRows));
      } catch (fetchError) {
        if (mounted && !abortController.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard status");
        }
      } finally {
        if (mounted && !abortController.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => abortController.abort();
  }, [dashboardApi, refreshTick]);

  const filteredAlerts = useMemo(
    () => getFilteredNotificationAlerts(notifications),
    [notifications],
  );

  const activeAlerts = useMemo(
    () => notifications.alerts.filter((item) => !item.acknowledged),
    [notifications.alerts],
  );

  const queueSeverity = dashboardStatus
    ? resolveQueueDepthSeverity(dashboardStatus.queue_depth)
    : "info";
  const queueColor: DashboardCardColor = mapSeverityToCardColor(queueSeverity);

  const handleAcknowledge = async (alertId: string) => {
    if (inFlightAlertIdsRef.current.has(alertId)) {
      return;
    }

    inFlightAlertIdsRef.current.add(alertId);
    const previousAlerts = notifications.alerts;
    const acknowledgedAt = new Date().toISOString();

    setNotifications((previous) =>
      setNotificationAlerts(
        previous,
        previous.alerts.map((item) =>
          item.alert_id === alertId
            ? {
                ...item,
                acknowledged: true,
                acknowledged_at: item.acknowledged_at ?? acknowledgedAt,
              }
            : item,
        ),
      ),
    );

    try {
      const acknowledgedAlert = await dashboardApi.acknowledgeDashboardAlert(alertId);
      setNotifications((previous) =>
        setNotificationAlerts(
          previous,
          previous.alerts.map((item) =>
            item.alert_id === alertId ? acknowledgedAlert : item,
          ),
        ),
      );
    } catch {
      setNotifications((previous) => setNotificationAlerts(previous, previousAlerts));
    } finally {
      inFlightAlertIdsRef.current.delete(alertId);
    }
  };

  return (
    <main aria-label="Station Overview" className="space-y-4">
      <section aria-label="Status cards" className="rounded-xl border border-zinc-800 p-3">
        {loading ? <div role="status">Loading status telemetry…</div> : null}
        {error ? <div role="alert">Status API unavailable: {error}</div> : null}
        {dashboardStatus ? (
          <>
            <p className="text-sm uppercase text-zinc-400">Service Health</p>
            <p>{dashboardStatus.service_health.reason}</p>
            <p data-testid="queue-depth-state" className={cn("uppercase", mapSeverityToStatusTextClass(queueSeverity))}>
              {queueSeverity}
            </p>
            <p data-testid="queue-color">{queueColor}</p>
            <p>{activeAlerts.length}/{notifications.alerts.length}</p>
          </>
        ) : null}
      </section>

      <section aria-label="Alert Center" className="rounded-xl border border-zinc-800 p-3 space-y-2">
        <div className="flex gap-2">
          {(dashboardStatus?.alert_center.filters ?? ["critical", "warning", "info"]).map((severity) => (
            <button
              key={severity}
              type="button"
              onClick={() => setNotifications((prev) => toggleNotificationSeverity(prev, severity))}
            >
              {severity}
            </button>
          ))}
        </div>
        {filteredAlerts.map((alert) => (
          <article key={alert.alert_id} className="rounded-lg border border-zinc-800 p-2">
            <p>{alert.title}</p>
            <p>{alert.description}</p>
            <button
              type="button"
              disabled={alert.acknowledged || inFlightAlertIdsRef.current.has(alert.alert_id)}
              onClick={() => void handleAcknowledge(alert.alert_id)}
            >
              {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
            </button>
          </article>
        ))}
      </section>
    </main>
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [api]);

  const activeAlerts = useMemo(() => notifications.alerts.filter((item) => !item.acknowledged), [notifications.alerts]);
  const filteredAlerts = useMemo(() => getFilteredNotificationAlerts(notifications), [notifications]);

  const queueSeverity = status ? resolveQueueDepthSeverity(status.queue_depth) : "info";
  const queueColor = mapSeverityToCardColor(queueSeverity);
  const healthColor = status ? mapSeverityToCardColor(status.service_health.status === "healthy" ? "info" : status.service_health.status === "offline" ? "critical" : "warning") : "cyan";

  const handleAcknowledge = async (alertId: string) => {
    if (ackInFlight[alertId]) return;
    setAckInFlight((prev) => ({ ...prev, [alertId]: true }));

    try {
      const acknowledgedAlert = await api.acknowledgeDashboardAlert(alertId);
      setNotifications((prev) => setNotificationAlerts(prev, prev.alerts.map((item) => (item.alert_id === alertId ? acknowledgedAlert : item))));
    } finally {
      setAckInFlight((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  };

    void load();
    return () => controller.abort();
  }, [api]);

  const fallbackTelemetry = useMemo(() => parseDashboardTelemetryFallback(telemetry), [telemetry]);
  const queueSeverity = dashboardStatus ? resolveQueueDepthSeverity(dashboardStatus.queue_depth) : null;
  const activeAlerts = alerts.filter((item) => !item.acknowledged).length;

  const cards = dashboardStatus
    ? [
        {
          label: "Service Health",
          value: dashboardStatus.service_health.status.toUpperCase(),
          icon: Activity,
          color: mapSeverityToCardColor(queueSeverity ?? "info"),
          trend: mapStatusToTrend(dashboardStatus.service_health.status === "healthy" ? "online" : dashboardStatus.service_health.status === "offline" ? "offline" : "degraded"),
        },
        {
          label: "Queue Depth",
          value: String(dashboardStatus.queue_depth.current_depth),
          icon: Gauge,
          color: mapSeverityToCardColor(queueSeverity ?? "info"),
          trend: "stable" as DashboardTrend,
        },
      ]
    : fallbackTelemetry
      ? [
          {
            label: "Service Health",
            value: fallbackTelemetry.serviceHealthStatus.toUpperCase(),
            icon: Activity,
            color: "orange" as DashboardCardColor,
            trend: "stable" as DashboardTrend,
          },
          {
            label: "Queue Depth",
            value: String(fallbackTelemetry.queueDepth),
            icon: Gauge,
            color: "orange" as DashboardCardColor,
            trend: "stable" as DashboardTrend,
          },
        ]
      : [];

  const handleAcknowledge = async (alertId: string) => {
    if (ackInFlight[alertId]) return;
    setAckInFlight((prev) => ({ ...prev, [alertId]: true }));
    try {
      const ack = await api.acknowledgeDashboardAlert(alertId);
      setAlerts((prev) => prev.map((item) => (item.alert_id === alertId ? ack : item)));
    } finally {
      setAckInFlight((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  return (
    <main className="space-y-4" data-testid="dashboard-view">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Dashboard</h2>
        <button type="button" className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300" onClick={() => setRefreshTick(tick => tick + 1)}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? <div role="status">Loading status telemetry…</div> : null}
      {error ? <div role="alert">Status API unavailable: {error}</div> : null}
      {!dashboardStatus && fallbackTelemetry ? <div data-testid="dashboard-fallback-banner">Fallback telemetry active.</div> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {dashboardStatus ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-400">
          Queue state: <span data-testid="queue-depth-state" className={cn("font-semibold uppercase", mapSeverityToStatusTextClass(queueSeverity ?? "info"))}>{queueSeverity}</span>
          <p data-testid="service-health-freshness">{formatFreshnessMinutes(dashboardStatus.service_health.observed_at)}</p>
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <h3 className="font-semibold text-zinc-300">Alert Center</h3>
          <span>{activeAlerts}/{alerts.length}</span>
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-zinc-500">No alerts in timeline.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.alert_id} className={cn("rounded border p-2", alert.acknowledged ? "opacity-60" : "opacity-100")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500">{alert.severity}</span>
                    <p className="text-sm text-zinc-100">{alert.title}</p>
                    <p className="text-xs text-zinc-400">{alert.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={alert.acknowledged || ackInFlight[alert.alert_id]}
                    onClick={() => void handleAcknowledge(alert.alert_id)}
                    className="rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase text-zinc-300 disabled:opacity-40"
                  >
                    {alert.acknowledged ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1"><Signal size={12} /> Thresholds</span>
        <p>
          Warning: {dashboardStatus?.queue_depth.thresholds.warning ?? fallbackTelemetry?.warningThreshold ?? "--"} · Critical: {dashboardStatus?.queue_depth.thresholds.critical ?? fallbackTelemetry?.criticalThreshold ?? "--"}
        </p>
      </section>
    </main>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Service" value={status?.service_health.status.toUpperCase() ?? "--"} icon={Activity} color={healthColor} trend={status ? mapStatusToTrend(status.service_health.status === "healthy" ? "online" : status.service_health.status) : "stable"} />
        <StatCard label="Queue Depth" value={status?.queue_depth.current_depth ?? "--"} unit="items" icon={Gauge} color={queueColor} trend="stable" />
        <StatCard label="Alert Center" value={`${activeAlerts.length}/${notifications.alerts.length}`} unit="active/total" icon={CheckCircle2} color={mapSeverityToCardColor(activeAlerts.length > 0 ? "warning" : "info")} trend={activeAlerts.length > 0 ? "down" : "up"} />
      </div>

      {status ? <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-400">Queue state: <span className={cn("font-semibold uppercase", mapSeverityToStatusTextClass(queueSeverity))}>{queueSeverity}</span></div> : null}
      {status ? <div data-testid="service-health-freshness" className="text-xs text-zinc-500">{formatFreshnessMinutes(status.service_health.observed_at)}</div> : null}
      {loading ? <div role="status" className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">Loading status telemetry…</div> : null}
      {error ? <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">Status API unavailable: {error}</div> : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">Alert Center</h2>
          <button type="button" onClick={() => void api.fetchDashboardStatus()} className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-300">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
        <div className="flex gap-1.5">
          {(["critical", "warning", "info"] as const).map((severity) => (
            <button key={severity} type="button" onClick={() => setNotifications((prev) => toggleNotificationSeverity(prev, severity))} className="rounded border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400">{severity}</button>
          ))}
        </div>
        {filteredAlerts.map((alert) => (
          <div key={alert.alert_id} className={cn("rounded-lg border border-zinc-800 p-2", alert.acknowledged && "opacity-60")}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-zinc-100">{alert.title}</div>
                <div className="text-[11px] text-zinc-500">{alert.description}</div>
              </div>
              {!alert.acknowledged ? (
                <button type="button" onClick={() => void handleAcknowledge(alert.alert_id)} disabled={Boolean(ackInFlight[alert.alert_id])} className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200">Acknowledge</button>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DegenEffectRack title="Deck FX" deck="A" controls={[{ key: "filter", label: "FLT" }, { key: "drive", label: "DRV" }, { key: "space", label: "SPC" }]} />
        <DegenWaveform />
        <DegenBeatGrid />
        <DegenScheduleTimeline />
        <DegenAIHost />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-zinc-500 text-xs flex items-center gap-2"><Signal size={12} /> live monitor</div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-zinc-500 text-xs flex items-center gap-2"><AlertTriangle size={12} /> queue guardrail active</div>
      </section>
    </div>
  );
}
