import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

import { DashboardView } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';
import * as dashboardClient from '@/lib/status/dashboardClient';

const fetchDashboardStatusMock = vi.spyOn(dashboardClient, 'fetchDashboardStatus');
const fetchDashboardAlertsMock = vi.spyOn(dashboardClient, 'fetchDashboardAlerts');
const acknowledgeDashboardAlertMock = vi.spyOn(dashboardClient, 'acknowledgeDashboardAlert');

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

function buildAlerts(): AlertCenterItem[] {
    return [
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
}

describe('DashboardView accessibility structure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchDashboardStatusMock.mockResolvedValue(buildStatus());
        fetchDashboardAlertsMock.mockResolvedValue(buildAlerts());
        acknowledgeDashboardAlertMock.mockImplementation(async (alertId) => {
            const alert = buildAlerts().find((item) => item.alert_id === alertId);
            if (!alert) {
                throw new Error(`Missing alert ${alertId}`);
            }
            return {
                ...alert,
                acknowledged: true,
                acknowledged_at: '2026-02-26T12:05:00.000Z',
            };
        });
    });

    it('renders semantic landmarks and labelled regions', async () => {
        render(<DashboardView />);

        await screen.findByText('Queue depth above critical threshold');

        expect(screen.getByRole('main', { name: 'Station Overview' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Status cards' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Alert Center' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Now playing' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Audio engine' })).toBeInTheDocument();
    });

    it('uses live region semantics for loading and error states', async () => {
        fetchDashboardStatusMock.mockImplementation(() => new Promise(() => {}));
        fetchDashboardAlertsMock.mockImplementation(() => new Promise(() => {}));

        const { unmount } = render(<DashboardView />);

        expect(screen.getByRole('status')).toHaveTextContent('Loading status telemetry…');
        unmount();

        fetchDashboardStatusMock.mockRejectedValue(new Error('status endpoint unavailable'));
        fetchDashboardAlertsMock.mockResolvedValue([]);

        render(<DashboardView />);

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('status endpoint unavailable');
    });

    it('keeps keyboard task flow refresh -> status cards -> alert actions', async () => {
        const user = userEvent.setup();
        render(<DashboardView />);

        await screen.findByText('Queue depth above critical threshold');

        await user.tab();
        expect(screen.getByRole('button', { name: /Refresh status/i })).toHaveFocus();

        await user.tab();
        expect(screen.getByRole('region', { name: 'Status cards' })).toHaveFocus();

        await user.tab();
        expect(screen.getAllByRole('button', { name: 'Acknowledge' })[0]).toHaveFocus();
    });

    it('acknowledges alerts through the API and updates the row state', async () => {
        const user = userEvent.setup();
        render(<DashboardView />);

        await screen.findByText('Queue depth above critical threshold');
        await user.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);

        expect(acknowledgeDashboardAlertMock).toHaveBeenCalledWith('alert-queue-critical');

        await waitFor(() => {
            expect(screen.getByText(/Ack at:/)).toBeInTheDocument();
        });
    });
});
