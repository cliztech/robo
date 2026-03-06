import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardView, parseDashboardTelemetryFallback, resolveQueueDepthSeverity, type DashboardViewApi } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

function buildStatus(overrides: Partial<DashboardStatusResponse> = {}): DashboardStatusResponse {
  return {
    service_health: {
      status: 'degraded',
      reason: 'queue depth above critical threshold',
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
      stale_reason: 'rotation worker has not published a successful run',
    },
    alert_center: {
      filters: ['info', 'warning', 'critical'],
      items: [],
    },
    ...overrides,
  };
}

function buildAlert(overrides: Partial<AlertCenterItem> = {}): AlertCenterItem {
  return {
    alert_id: 'alert-queue-critical',
    severity: 'critical',
    title: 'Queue depth above critical threshold',
    description: 'Queue depth has exceeded 50 items for over 5 minutes.',
    created_at: '2026-02-26T11:53:00.000Z',
    acknowledged: false,
    acknowledged_at: null,
    ...overrides,
  };
}

function buildApi(overrides: Partial<DashboardViewApi> = {}): DashboardViewApi {
  return {
    fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
    fetchDashboardAlerts: vi.fn().mockResolvedValue([buildAlert()]),
    acknowledgeDashboardAlert: vi.fn().mockResolvedValue(buildAlert({ acknowledged: true })),
    ...overrides,
  };
}

describe('dashboard telemetry contracts', () => {
  it('honors API-provided queue depth state', () => {
    const status = buildStatus({
      queue_depth: {
        ...buildStatus().queue_depth,
        current_depth: 80,
        state: 'info',
      },
    });

    expect(resolveQueueDepthSeverity(status.queue_depth)).toBe('info');
  });

  it('rejects malformed fallback telemetry', () => {
    expect(parseDashboardTelemetryFallback({ serviceHealthStatus: 'healthy', queueDepth: 'high' })).toBeNull();
    expect(parseDashboardTelemetryFallback({ queueDepth: 12 })).toBeNull();
  });
});

describe('DashboardView rendering', () => {
  it('renders fallback telemetry when status API fails', async () => {
    const api = buildApi({
      fetchDashboardStatus: vi.fn().mockRejectedValue(new Error('status endpoint unavailable')),
      fetchDashboardAlerts: vi.fn().mockResolvedValue([]),
    });

    render(
      <DashboardView
        api={api}
        telemetry={{
          serviceHealthStatus: 'degraded',
          queueDepth: 22,
          warningThreshold: 30,
          criticalThreshold: 50,
          activeAlerts: 1,
          totalAlerts: 2,
        }}
      />
    );

    expect((await screen.findByRole('alert')).textContent).toContain('Status API unavailable: status endpoint unavailable');
    expect(screen.getByTestId('dashboard-fallback-banner').textContent).toContain('Fallback telemetry active.');
    expect(screen.getByText('22')).toBeTruthy();
  });

  it('renders API status cards when service responds', async () => {
    const api = buildApi();
    render(<DashboardView api={api} />);

    expect(await screen.findByText('DEGRADED')).toBeTruthy();
    expect(screen.getByText('54')).toBeTruthy();
  });
});
