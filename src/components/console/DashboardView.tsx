"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  );
}
