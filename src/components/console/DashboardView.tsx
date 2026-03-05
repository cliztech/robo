"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (
    severity?: AlertSeverity,
    signal?: AbortSignal,
  ) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (
    alertId: string,
    signal?: AbortSignal,
  ) => Promise<AlertCenterItem>;
}

export interface DashboardViewProps {
  api?: Partial<DashboardViewApi>;
  pollIntervalMs?: number;
}

const defaultApi: DashboardViewApi = {
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
  );
}
