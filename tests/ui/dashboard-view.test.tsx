import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

vi.mock('@/components/audio/DegenEffectRack', () => ({ DegenEffectRack: () => <div data-testid="fx-rack" /> }));
vi.mock('@/components/audio/DegenBeatGrid', () => ({ DegenBeatGrid: () => <div data-testid="beat-grid" /> }));
vi.mock('@/components/audio/DegenWaveform', () => ({ DegenWaveform: () => <div data-testid="waveform" /> }));
vi.mock('@/components/schedule/DegenScheduleTimeline', () => ({ DegenScheduleTimeline: () => <div data-testid="schedule" /> }));
vi.mock('@/components/ai/DegenAIHost', () => ({ DegenAIHost: () => <div data-testid="ai-host" /> }));

vi.mock('@/lib/status/dashboardClient', () => ({
    fetchDashboardStatus: vi.fn(),
    fetchDashboardAlerts: vi.fn(),
    acknowledgeDashboardAlert: vi.fn(),
}));

import { DashboardView } from '@/components/console/DashboardView';
import {
    acknowledgeDashboardAlert,
    fetchDashboardAlerts,
    fetchDashboardStatus,
} from '@/lib/status/dashboardClient';

function buildStatus(): DashboardStatusResponse {
    return {
        service_health: {
            status: 'degraded',
            reason: 'queue depth above critical threshold',
            observed_at: '2026-02-26T12:00:00.000Z',
        },
        queue_depth: {
            current_depth: 54,
            trend: [{ timestamp: '2026-02-26T12:00:00.000Z', depth: 54 }],
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

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function alertCard(title: string): HTMLElement {
    const titleElement = screen.getByText(title);
    const card = titleElement.closest('.rounded-lg');
    if (!card) {
        throw new Error(`Could not find alert card for ${title}`);
    }
    return card;
}

describe('DashboardView acknowledge concurrency', () => {
    beforeEach(() => {
        vi.mocked(fetchDashboardStatus).mockResolvedValue(buildStatus());
        vi.mocked(fetchDashboardAlerts).mockResolvedValue(buildAlerts());
    });

    afterEach(() => {
        vi.clearAllMocks();
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
    it('keeps successful acknowledgement when a sibling acknowledgement fails', async () => {
        const user = userEvent.setup();
        const successRequest = deferred<AlertCenterItem>();
        const failedRequest = deferred<AlertCenterItem>();

        vi.mocked(acknowledgeDashboardAlert).mockImplementation((alertId: string) => {
            if (alertId === 'alert-queue-critical') {
                return successRequest.promise;
            }
            if (alertId === 'alert-rotation-stale') {
                return failedRequest.promise;
            }
            return Promise.reject(new Error(`unexpected alert id: ${alertId}`));
        });

        render(<DashboardView />);

        await screen.findByText('Queue depth above critical threshold');

        await user.click(within(alertCard('Queue depth above critical threshold')).getByRole('button', { name: 'Acknowledge' }));
        await user.click(within(alertCard('Rotation data stale')).getByRole('button', { name: 'Acknowledge' }));

        await waitFor(() => {
            expect(within(alertCard('Queue depth above critical threshold')).getByRole('button')).toHaveTextContent('Acknowledged');
            expect(within(alertCard('Rotation data stale')).getByRole('button')).toHaveTextContent('Acknowledged');
        });

        expect(acknowledgeDashboardAlertMock).toHaveBeenCalledWith('alert-queue-critical');

        await waitFor(() => {
            expect(screen.getByText(/Ack at:/)).toBeInTheDocument();
        });
        successRequest.resolve({
            ...buildAlerts()[0],
            acknowledged: true,
            acknowledged_at: '2026-02-26T12:05:00.000Z',
        });

        await waitFor(() => {
            expect(within(alertCard('Queue depth above critical threshold')).getByRole('button')).toHaveTextContent('Acknowledged');
        });

        failedRequest.reject(new Error('ack failed'));

        await waitFor(() => {
            expect(within(alertCard('Rotation data stale')).getByRole('button')).toHaveTextContent('Acknowledge');
        });

        expect(within(alertCard('Queue depth above critical threshold')).getByRole('button')).toHaveTextContent('Acknowledged');
        expect(acknowledgeDashboardAlert).toHaveBeenNthCalledWith(1, 'alert-queue-critical');
        expect(acknowledgeDashboardAlert).toHaveBeenNthCalledWith(2, 'alert-rotation-stale');
    });

    it('ignores duplicate in-flight acknowledge requests for the same alert id', async () => {
        const user = userEvent.setup();
        const pendingRequest = deferred<AlertCenterItem>();

        vi.mocked(acknowledgeDashboardAlert).mockReturnValue(pendingRequest.promise);

        render(<DashboardView />);

        await screen.findByText('Queue depth above critical threshold');
        const queueAlertButton = within(alertCard('Queue depth above critical threshold')).getByRole('button', { name: 'Acknowledge' });

        await user.click(queueAlertButton);
        await user.click(queueAlertButton);

        expect(acknowledgeDashboardAlert).toHaveBeenCalledTimes(1);
        pendingRequest.resolve({
            ...buildAlerts()[0],
            acknowledged: true,
            acknowledged_at: '2026-02-26T12:10:00.000Z',
        });

        await waitFor(() => {
            expect(within(alertCard('Queue depth above critical threshold')).getByRole('button')).toHaveTextContent('Acknowledged');
        });
    });
});
