import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { DashboardView, resolveQueueDepthSeverity, type DashboardViewApi } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

function buildStatus(overrides: Partial<DashboardStatusResponse> = {}): DashboardStatusResponse {
  return {
    service_health: {
      status: 'degraded',
      reason: 'Queue depth above critical threshold',
      observed_at: '2026-02-26T12:00:00.000Z',
    },
    queue_depth: {
      current_depth: 54,
      trend: [
        { timestamp: '2026-02-26T11:50:00.000Z', depth: 18 },
        { timestamp: '2026-02-26T12:00:00.000Z', depth: 54 },
      ],
      thresholds: { warning: 30, critical: 50 },
      state: 'critical',
    },
    rotation: {
      last_successful_rotation_at: '2026-02-26T11:13:00.000Z',
      stale_after_minutes: 30,
      is_stale: true,
      stale_reason: 'rotation worker stale',
    },
    alert_center: {
      filters: ['critical', 'warning', 'info'],
      items: [],
    },
    ...overrides,
  };
}

function buildAlerts(overrides: Partial<AlertCenterItem>[] = []): AlertCenterItem[] {
  const base: AlertCenterItem[] = [
    {
      alert_id: 'alert-queue-critical',
      severity: 'critical',
      title: 'Queue depth above critical threshold',
      description: 'Queue depth has exceeded 50 items for over 5 minutes.',
      created_at: '2026-02-26T11:53:00.000Z',
      acknowledged: false,
      acknowledged_at: null,
    },
    {
      alert_id: 'alert-rotation-stale',
      severity: 'warning',
      title: 'Rotation data stale',
      description: 'No successful rotation has been recorded for over 45 minutes.',
      created_at: '2026-02-26T11:58:00.000Z',
      acknowledged: true,
      acknowledged_at: '2026-02-26T12:01:00.000Z',
    },
  ];

  return base.map((item, index) => ({ ...item, ...(overrides[index] ?? {}) }));
}

function buildApi(status: DashboardStatusResponse, alerts: AlertCenterItem[]): DashboardViewApi {
  return {
    fetchDashboardStatus: vi.fn().mockResolvedValue(status),
    fetchDashboardAlerts: vi.fn().mockResolvedValue(alerts),
    acknowledgeDashboardAlert: vi.fn(async (alertId: string) => ({
      ...alerts.find((a) => a.alert_id === alertId)!,
      acknowledged: true,
      acknowledged_at: '2026-02-26T12:05:00.000Z',
    })),
  };
}

describe('resolveQueueDepthSeverity', () => {
  it('honors queue_depth.state when provided', () => {
    const queueDepth = buildStatus({
      queue_depth: {
        current_depth: 60,
        trend: [],
        thresholds: { warning: 30, critical: 50 },
        state: 'info',
      },
    }).queue_depth;

    expect(resolveQueueDepthSeverity(queueDepth)).toBe('info');
  });
});

describe('DashboardView', () => {

  it('renders loading then mapped status sections', async () => {
    const api = buildApi(buildStatus(), buildAlerts());
    render(<DashboardView api={api} />);

    expect(screen.getByText('Loading status telemetry…')).toBeInTheDocument();
    expect(await screen.findByText('Service Health')).toBeInTheDocument();
    expect(screen.getByText('Queue Depth')).toBeInTheDocument();
    expect(screen.getByTestId('service-health-freshness').textContent).toMatch(/Updated .* min ago|Updated —/);
  });

  it('filters alerts and acknowledges item', async () => {
    const alerts = buildAlerts();
    const api = buildApi(buildStatus(), alerts);
    const user = userEvent.setup();

    render(<DashboardView api={api} />);
    await screen.findByRole('heading', { name: 'Service Health' });

    await user.click(screen.getByRole('button', { name: 'warning' }));
    expect(screen.queryByText('Rotation data stale')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'warning' }));
    const row = screen.getByText('Rotation data stale').closest('div.rounded-lg');
    expect(row).toHaveClass('opacity-60');

    await user.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);
    await waitFor(() => expect(screen.getByText('2/2')).toBeInTheDocument());
  });
});
