import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

const fetchDashboardStatusMock = vi.fn();
const fetchDashboardAlertsMock = vi.fn();
const acknowledgeDashboardAlertMock = vi.fn();

vi.mock('@/lib/status/dashboardClient', () => ({
  fetchDashboardStatus: (signal?: AbortSignal) => fetchDashboardStatusMock(signal),
  fetchDashboardAlerts: (severity?: 'critical' | 'warning' | 'info', signal?: AbortSignal) =>
    fetchDashboardAlertsMock(severity, signal),
  acknowledgeDashboardAlert: (alertId: string, signal?: AbortSignal) =>
    acknowledgeDashboardAlertMock(alertId, signal),
}));

import { DashboardView } from '@/components/console/DashboardView';

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

describe('DashboardView', () => {
  beforeEach(() => {
    fetchDashboardStatusMock.mockReset();
    fetchDashboardAlertsMock.mockReset();
    acknowledgeDashboardAlertMock.mockReset();
  });

  it('renders loading state before status resolves', () => {
    fetchDashboardStatusMock.mockImplementation(() => new Promise(() => {}));
    fetchDashboardAlertsMock.mockResolvedValue([]);

    render(<DashboardView />);

    expect(screen.getByText('Loading status telemetry…')).toBeInTheDocument();
  });

  it('renders error state when status request fails', async () => {
    fetchDashboardStatusMock.mockRejectedValue(new Error('status endpoint unavailable'));
    fetchDashboardAlertsMock.mockResolvedValue([]);

    render(<DashboardView />);

    expect(await screen.findByText(/Status API unavailable: status endpoint unavailable/)).toBeInTheDocument();
  });

  it('renders mapped status values from dashboard response', async () => {
    fetchDashboardStatusMock.mockResolvedValue(buildStatus());
    fetchDashboardAlertsMock.mockResolvedValue(buildAlerts());

    render(<DashboardView />);

    await screen.findByText('queue depth above critical threshold');
    expect(screen.getByText('Service Health')).toBeInTheDocument();
    expect(screen.getByText('Queue Depth')).toBeInTheDocument();
    expect(screen.getByText('Queue Thresholds')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('30/50')).toBeInTheDocument();
  });

  it('acknowledges an alert and updates alert counter', async () => {
    const user = userEvent.setup();
    fetchDashboardStatusMock.mockResolvedValue(buildStatus());
    fetchDashboardAlertsMock.mockResolvedValue(buildAlerts());
    acknowledgeDashboardAlertMock.mockResolvedValue({
      ...buildAlerts()[0],
      acknowledged: true,
      acknowledged_at: '2026-02-26T12:05:00.000Z',
    });

    render(<DashboardView />);

    await screen.findByText('Queue depth above critical threshold');
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }));

    expect(acknowledgeDashboardAlertMock).toHaveBeenCalledWith('alert-queue-critical', undefined);
    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  it.each([
    { depth: 29, expected: '29' },
    { depth: 30, expected: '30' },
    { depth: 50, expected: '50' },
  ])('renders API queue depth=%s without fallback values', async ({ depth, expected }) => {
    fetchDashboardStatusMock.mockResolvedValue(
      buildStatus({
        queue_depth: {
          current_depth: depth,
          trend: [{ timestamp: '2026-02-26T12:00:00.000Z', depth }],
          thresholds: { warning: 30, critical: 50 },
          state: 'info',
        },
      })
    );
    fetchDashboardAlertsMock.mockResolvedValue(buildAlerts());

    render(<DashboardView />);

    await screen.findByText('Queue Depth');
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText('1,247')).not.toBeInTheDocument();
    expect(screen.queryByText('99.8')).not.toBeInTheDocument();
    expect(screen.queryByText('320')).not.toBeInTheDocument();
  });
});
