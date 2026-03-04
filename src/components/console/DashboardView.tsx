'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  acknowledgeDashboardAlert,
  fetchDashboardAlerts,
  fetchDashboardStatus,
  type AlertCenterItem,
  type AlertSeverity,
  type DashboardStatusResponse,
} from '@/lib/status/dashboardClient';
import { mapSeverityToCardColor, mapSeverityToStatusTextClass, type DashboardCardColor } from './dashboard.types';
import { cn } from '@/lib/utils';

export interface DashboardViewApi {
  fetchDashboardStatus: (signal?: AbortSignal) => Promise<DashboardStatusResponse>;
  fetchDashboardAlerts: (severity?: AlertSeverity, signal?: AbortSignal) => Promise<AlertCenterItem[]>;
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) => Promise<AlertCenterItem>;
}

interface DashboardViewProps {
  telemetry?: unknown;
  api?: Partial<DashboardViewApi>;
}

const defaultDashboardViewApi: DashboardViewApi = {
  fetchDashboardStatus,
  fetchDashboardAlerts,
  acknowledgeDashboardAlert,
};

function isAlertSeverity(value: string): value is AlertSeverity {
  return value === 'critical' || value === 'warning' || value === 'info';
}

function deriveQueueSeverity(depth: number, thresholds: { warning: number; critical: number }): AlertSeverity {
  if (depth >= thresholds.critical) return 'critical';
  if (depth >= thresholds.warning) return 'warning';
  return 'info';
}

export function resolveQueueDepthSeverity(
  queueDepth: DashboardStatusResponse['queue_depth']
): AlertSeverity {
  if (isAlertSeverity(queueDepth.state)) return queueDepth.state;
  return deriveQueueSeverity(queueDepth.current_depth, queueDepth.thresholds);
}

function formatFreshnessMinutes(value: string | null): string {
  if (!value) return 'Updated —';
  const observedAt = new Date(value).getTime();
  if (Number.isNaN(observedAt)) return 'Updated —';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - observedAt) / 60_000));
  return `Updated ${elapsedMinutes} min ago`;
}

export function DashboardView({ api = defaultDashboardViewApi }: DashboardViewProps) {
  const dashboardApi = useMemo(() => ({ ...defaultDashboardViewApi, ...api }), [api]);
  const [status, setStatus] = useState<DashboardStatusResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertCenterItem[]>([]);
  const [filters, setFilters] = useState<Record<AlertSeverity, boolean>>({ critical: true, warning: true, info: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await dashboardApi.fetchDashboardStatus(ac.signal);
        const fetchedAlerts = await dashboardApi.fetchDashboardAlerts(undefined, ac.signal);
        if (!mounted) return;
        setStatus(dashboard);
        setAlerts(fetchedAlerts?.length ? fetchedAlerts : dashboard.alert_center.items);
      } catch (err) {
        if (!mounted || ac.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'unknown error';
        setError(`Status API unavailable: ${message}`);
      } finally {
        if (mounted && !ac.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [dashboardApi]);

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => filters[alert.severity]),
    [alerts, filters]
  );

  const acknowledgedCount = useMemo(
    () => alerts.filter((alert) => alert.acknowledged).length,
    [alerts]
  );

  if (loading) {
    return <div role="status">Loading status telemetry…</div>;
  }

  if (error || !status) {
    return <div role="alert">{error ?? 'Status API unavailable: unknown error'}</div>;
  }

  const queueSeverity = resolveQueueDepthSeverity(status.queue_depth);
  const queueCardColor: DashboardCardColor = mapSeverityToCardColor(queueSeverity);

  return (
    <main className="space-y-4">
      <section>
        <h2>Service Health</h2>
        <p className={cn('font-semibold', mapSeverityToStatusTextClass(queueSeverity))}>{status.service_health.reason}</p>
        <p data-testid="service-health-freshness">{formatFreshnessMinutes(status.service_health.observed_at)}</p>
      </section>

      <section>
        <h3>Queue Depth</h3>
        <div>{status.queue_depth.current_depth}</div>
        <div>Queue Thresholds</div>
        <div>{status.queue_depth.thresholds.warning}/{status.queue_depth.thresholds.critical}</div>
        <div data-testid="queue-depth-threshold-markers" data-card-color={queueCardColor}>
          <span data-testid="queue-warning-marker">W:{status.queue_depth.thresholds.warning}</span>
          <span data-testid="queue-critical-marker">C:{status.queue_depth.thresholds.critical}</span>
        </div>
      </section>

      <section>
        <div className="flex gap-2">
          {(['critical', 'warning', 'info'] as AlertSeverity[]).map((severity) => (
            <button
              key={severity}
              type="button"
              aria-label={severity}
              onClick={() => setFilters((prev) => ({ ...prev, [severity]: !prev[severity] }))}
            >
              {severity}
            </button>
          ))}
        </div>
        <div>{acknowledgedCount}/{alerts.length}</div>

        {filteredAlerts.map((alert) => (
          <div key={alert.alert_id} className={cn('rounded-lg border p-2', alert.acknowledged && 'opacity-60')}>
            <div className="font-semibold">{alert.title}</div>
            <div>{alert.description}</div>
            <button
              type="button"
              onClick={async () => {
                const updated = await dashboardApi.acknowledgeDashboardAlert(alert.alert_id, undefined);
                setAlerts((prev) => prev.map((row) => (row.alert_id === updated.alert_id ? updated : row)));
              }}
              disabled={alert.acknowledged}
            >
              Acknowledge
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
