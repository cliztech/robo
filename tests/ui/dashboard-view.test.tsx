import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

import { DashboardView } from '@/components/console/DashboardView';
import {
  acknowledgeDashboardAlert,
  fetchDashboardAlerts,
  fetchDashboardStatus,
  type DashboardStatusResponse,
} from '@/lib/status/dashboardClient';

vi.mock('@/lib/status/dashboardClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/status/dashboardClient')>('@/lib/status/dashboardClient');
  return {
    ...actual,
    fetchDashboardStatus: vi.fn(),
    fetchDashboardAlerts: vi.fn(),
    acknowledgeDashboardAlert: vi.fn(),
  };
});

const mockedFetchDashboardStatus = vi.mocked(fetchDashboardStatus);
const mockedFetchDashboardAlerts = vi.mocked(fetchDashboardAlerts);
const mockedAcknowledgeDashboardAlert = vi.mocked(acknowledgeDashboardAlert);

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
      items: [
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
      ],
    },
    ...overrides,
  };
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-26T12:10:00.000Z'));
    const status = buildStatus();
    mockedFetchDashboardStatus.mockResolvedValue(status);
    mockedFetchDashboardAlerts.mockResolvedValue(status.alert_center.items);
    mockedAcknowledgeDashboardAlert.mockResolvedValue(status.alert_center.items[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('renders service freshness helper text from observed_at', async () => {
    render(<DashboardView />);

    expect(await screen.findByText('Queue depth above critical threshold')).toBeInTheDocument();
    expect(screen.getByTestId('service-health-freshness')).toHaveTextContent('Updated 10 min ago');
  });

  it('renders queue threshold markers from queue_depth.thresholds', async () => {
    render(<DashboardView />);

    await screen.findByText('Queue depth above critical threshold');
    expect(screen.getByTestId('queue-depth-threshold-markers')).toBeInTheDocument();
    expect(screen.getByTestId('queue-warning-marker')).toBeInTheDocument();
    expect(screen.getByTestId('queue-critical-marker')).toBeInTheDocument();
  });

  it('filters alert rows by severity chips and keeps acknowledged alerts visible but muted', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DashboardView />);

    expect(await screen.findByText('Queue depth above critical threshold')).toBeInTheDocument();
    expect(screen.getByText('Rotation data stale')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'warning' }));

    expect(screen.queryByText('Rotation data stale')).not.toBeInTheDocument();
    expect(screen.getByText('Queue depth above critical threshold')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'warning' }));

    const acknowledgedRow = screen.getByText('Rotation data stale').closest('div.rounded-lg');
    expect(acknowledgedRow).toHaveClass('opacity-60');
  });
});
