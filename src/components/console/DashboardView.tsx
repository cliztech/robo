"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Gauge, RefreshCw } from "lucide-react";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenBeatGrid } from "@/components/audio/DegenBeatGrid";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
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
import { mapSeverityToCardColor, mapSeverityToStatusTextClass } from "./dashboard.types";

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (severity?: AlertSeverity, signal?: AbortSignal) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) => Promise<AlertCenterItem>;
}

interface DashboardViewProps {
  api?: DashboardViewApi;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [ackInFlight, setAckInFlight] = useState<Record<string, boolean>>({});
  const inFlightAlertIdsRef = useRef(new Set<string>());
  const previousAlertByIdRef = useRef<Record<string, AlertCenterItem | undefined>>({});

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

        if (!mounted) return;
        setDashboardStatus(dashboard);
        setNotifications(setNotificationAlerts(createNotificationsState(dashboard.alert_center), alertRows));
      } catch (fetchError) {
        if (!abortController.signal.aborted && mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard status");
        }
      } finally {
        if (!abortController.signal.aborted && mounted) {
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
  );
}
