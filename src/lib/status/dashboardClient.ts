export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ServiceHealth = 'healthy' | 'degraded' | 'offline';

export interface AlertCenterItem {
  alert_id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

export interface QueueTrendPoint {
  timestamp: string;
  depth: number;
}

export interface ThresholdBand {
  warning: number;
  critical: number;
}

export interface QueueDepthTrend {
  current_depth: number;
  trend: QueueTrendPoint[];
  thresholds: ThresholdBand;
  state: AlertSeverity;
}

export interface ServiceHealthCard {
  status: ServiceHealth;
  reason: string;
  observed_at: string;
}

export interface RotationStatus {
  last_successful_rotation_at: string;
  stale_after_minutes: number;
  is_stale: boolean;
  stale_reason: string | null;
}

export interface AlertCenter {
  filters: AlertSeverity[];
  items: AlertCenterItem[];
}

export interface DashboardStatusResponse {
  service_health: ServiceHealthCard;
  queue_depth: QueueDepthTrend;
  rotation: RotationStatus;
  alert_center: AlertCenter;
}

let dashboardStatusCache: {
  etag: string | null;
  payload: DashboardStatusResponse | null;
} = {
  etag: null,
  payload: null,
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({} as { detail?: string; error?: string; message?: string }));
    throw new Error(body.detail ?? body.error ?? body.message ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchDashboardStatus(signal?: AbortSignal): Promise<DashboardStatusResponse> {
  const headers: HeadersInit = {};
  if (dashboardStatusCache.etag) {
    headers['If-None-Match'] = dashboardStatusCache.etag;
  }

  const response = await fetch('/api/v1/status/dashboard', {
    method: 'GET',
    signal,
    cache: 'no-store',
    headers,
  });

  if (response.status === 304) {
    if (dashboardStatusCache.payload) {
      return dashboardStatusCache.payload;
    }
    throw new Error('Dashboard status cache miss on 304 response');
  }

  const payload = await parseJson<DashboardStatusResponse>(response);
  dashboardStatusCache = {
    etag: response.headers.get('ETag'),
    payload,
  };
  return payload;
}

export async function fetchDashboardAlerts(
  severity?: AlertSeverity,
  signal?: AbortSignal
): Promise<AlertCenterItem[]> {
  const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';
  const response = await fetch(`/api/v1/status/dashboard/alerts${query}`, {
    method: 'GET',
    signal,
    cache: 'no-store',
  });

  return parseJson<AlertCenterItem[]>(response);
}

export async function acknowledgeDashboardAlert(
  alertId: string,
  signal?: AbortSignal
): Promise<AlertCenterItem> {
  const response = await fetch(`/api/v1/status/dashboard/alerts/${encodeURIComponent(alertId)}/ack`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseJson<AlertCenterItem>(response);
}
