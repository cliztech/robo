"use client";

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
import { mapSeverityToCardColor, mapSeverityToStatusTextClass, mapStatusToTrend, type DashboardCardColor, type DashboardTrend } from "./dashboard.types";

export interface DashboardTelemetryFallback {
  serviceHealthStatus: DashboardStatusResponse["service_health"]["status"];
  queueDepth: number;
  warningThreshold: number;
  criticalThreshold: number;
  activeAlerts: number;
  totalAlerts: number;
}

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (severity?: AlertSeverity, signal?: AbortSignal) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) => Promise<AlertCenterItem>;
}

interface DashboardViewProps {
  telemetry?: DashboardTelemetryFallback | null;
  api?: DashboardViewApi;
}

const defaultDashboardViewApi: DashboardViewApi = {
  fetchDashboardStatus,
  fetchDashboardAlerts,
  acknowledgeDashboardAlert,
};

function formatFreshnessMinutes(value: string | null): string {
  if (!value) return "Updated —";
  const observedAt = new Date(value).getTime();
  if (Number.isNaN(observedAt)) return "Updated —";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - observedAt) / 60_000));
  return `Updated ${elapsedMinutes} min ago`;
}

function isAlertSeverity(value: unknown): value is AlertSeverity {
  return value === "critical" || value === "warning" || value === "info";
}

function deriveQueueSeverity(currentDepth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
  if (currentDepth >= thresholds.critical) return "critical";
  if (currentDepth >= thresholds.warning) return "warning";
  return "info";
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

    const load = async () => {
      setLoading(true);
      setError(null);
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
        <button type="button" className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300" onClick={() => window.location.reload()}>
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
  );
}
