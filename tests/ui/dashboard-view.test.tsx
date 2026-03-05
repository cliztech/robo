import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DashboardView, resolveQueueDepthSeverity, type DashboardViewApi } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

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
      acknowledged: false,
      acknowledged_at: null,
    },
  ];

  return base.map((item, index) => ({ ...item, ...(overrides[index] ?? {}) }));
}

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
      items: buildAlerts(),
    },
    ...overrides,
  };
}

describe('resolveQueueDepthSeverity', () => {
  it('honors API-provided queue_depth.state even when thresholds imply different severity', () => {
    const queueDepth = buildStatus({
      queue_depth: {
        ...buildStatus().queue_depth,
        current_depth: 60,
        state: 'info',
      },
    }).queue_depth;

    expect(resolveQueueDepthSeverity(queueDepth)).toBe('info');
  });
});

describe('DashboardView', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-02-26T12:10:00.000Z').getTime());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApi(status = buildStatus(), alerts = buildAlerts()): DashboardViewApi {
    return {
      fetchDashboardStatus: vi.fn().mockResolvedValue(status),
      fetchDashboardAlerts: vi.fn().mockResolvedValue(alerts),
      acknowledgeDashboardAlert: vi.fn().mockResolvedValue({ ...alerts[0], acknowledged: true }),
    };
  }

  it('renders service freshness helper text from observed_at', async () => {
    render(<DashboardView api={createApi()} />);

    expect(await screen.findByText('queue depth above critical threshold')).toBeInTheDocument();
    expect(screen.getByTestId('service-health-freshness')).toHaveTextContent('Updated 10 min ago');
  });

  it('filters alerts by severity chips', async () => {
    const user = userEvent.setup();
    render(<DashboardView api={createApi()} />);

    await screen.findByText('Queue depth above critical threshold');
    await user.click(screen.getByRole('button', { name: 'warning' }));

    expect(screen.queryByText('Rotation data stale')).not.toBeInTheDocument();
    expect(screen.getByText('Queue depth above critical threshold')).toBeInTheDocument();
  });

  it('rolls back optimistic alert acknowledgement on API failure', async () => {
    const user = userEvent.setup();
    const alerts = buildAlerts();
    const api: DashboardViewApi = {
      fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus({ alert_center: { filters: ['info', 'warning', 'critical'], items: alerts } })),
      fetchDashboardAlerts: vi.fn().mockResolvedValue(alerts),
      acknowledgeDashboardAlert: vi.fn().mockRejectedValue(new Error('failed')),
    };

    render(<DashboardView api={api} />);

    await screen.findByText('Queue depth above critical threshold');
    await user.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);

    expect(screen.getAllByRole('button', { name: 'Acknowledge' })[0]).toBeEnabled();
  });
});
