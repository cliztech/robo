import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

import { DashboardView, type DashboardStatusApi, type DashboardStatusResponse } from '@/components/console/DashboardView';


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
                    acknowledged: false,
                    acknowledged_at: null,
                },
            ],
        },
        ...overrides,
    };
}

describe('DashboardView', () => {
    it('renders loading state before status resolves', async () => {
        const api: DashboardStatusApi = {
            fetchDashboardStatus: () => new Promise(() => {}),
            acknowledgeAlert: vi.fn(),
        };

        render(<DashboardView api={api} />);

        expect(screen.getByText('Loading dashboard status…')).toBeInTheDocument();
    });

    it('renders error state when status request fails', async () => {
        const api: DashboardStatusApi = {
            fetchDashboardStatus: vi.fn().mockRejectedValue(new Error('status endpoint unavailable')),
            acknowledgeAlert: vi.fn(),
        };

        render(<DashboardView api={api} />);

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('status endpoint unavailable');
    });

    it('renders mapped status values from dashboard response', async () => {
        const api: DashboardStatusApi = {
            fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
            acknowledgeAlert: vi.fn(),
        };

        render(<DashboardView api={api} />);

        await screen.findByText('Queue depth above critical threshold');
        expect(screen.getByText('DEGRADED')).toBeInTheDocument();
        expect(screen.getByText('Queue Depth')).toBeInTheDocument();
        expect(screen.getByText('Warning Threshold')).toBeInTheDocument();
        expect(screen.getByText('Critical Threshold')).toBeInTheDocument();
        expect(screen.getByTestId('queue-depth-state')).toHaveTextContent('critical');
    });

    it('acknowledges an alert, calls API with id, and updates UI counts/timestamp', async () => {
        const user = userEvent.setup();
        const acknowledgedAt = '2026-02-26T12:05:00.000Z';
        const api: DashboardStatusApi = {
            fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
            acknowledgeAlert: vi.fn().mockResolvedValue({
                ...buildStatus().alert_center.items[0],
                acknowledged: true,
                acknowledged_at: acknowledgedAt,
            }),
        };

        render(<DashboardView api={api} />);

        await screen.findByText('Queue depth above critical threshold');
        await user.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);

        expect(api.acknowledgeAlert).toHaveBeenCalledWith('alert-queue-critical');

        await waitFor(() => {
            expect(screen.getByTestId('alert-ack-alert-queue-critical')).not.toHaveTextContent('Ack at: —');
        });
        expect(screen.getByTestId('severity-count-critical')).toHaveTextContent('Critical: 0');
    });

    it.each([
        { depth: 29, expected: 'info' },
        { depth: 30, expected: 'warning' },
        { depth: 49, expected: 'warning' },
        { depth: 50, expected: 'critical' },
    ])('renders threshold severity for queue depth=$depth', async ({ depth, expected }) => {
        const api: DashboardStatusApi = {
            fetchDashboardStatus: vi.fn().mockResolvedValue(
                buildStatus({
                    queue_depth: {
                        current_depth: depth,
                        trend: [{ timestamp: '2026-02-26T12:00:00.000Z', depth }],
                        thresholds: { warning: 30, critical: 50 },
                        state: 'info',
                    },
                })
            ),
            acknowledgeAlert: vi.fn(),
        };

        render(<DashboardView api={api} />);

        await screen.findByTestId('queue-depth-state');
        expect(screen.getByTestId('queue-depth-state')).toHaveTextContent(expected);
    });

    it('does not render hardcoded fallback metrics when real dashboard data exists', async () => {
        const api: DashboardStatusApi = {
            fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
            acknowledgeAlert: vi.fn(),
        };

        render(<DashboardView api={api} />);

        await screen.findByText('Queue depth above critical threshold');
        expect(screen.queryByText('1,247')).not.toBeInTheDocument();
        expect(screen.queryByText('99.8')).not.toBeInTheDocument();
        expect(screen.queryByText('320')).not.toBeInTheDocument();
    });
});
