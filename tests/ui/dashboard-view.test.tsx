import { resolveQueueDepthSeverity } from '@/components/console/DashboardView';
import type { DashboardStatusResponse } from '@/lib/status/dashboardClient';

function buildQueueDepth(
    overrides: Partial<DashboardStatusResponse['queue_depth']> = {}
): DashboardStatusResponse['queue_depth'] {
    return {
        current_depth: 54,
        trend: [
            { timestamp: '2026-02-26T11:50:00.000Z', depth: 18 },
            { timestamp: '2026-02-26T12:00:00.000Z', depth: 54 },
        ],
        thresholds: { warning: 30, critical: 50 },
        state: 'critical',
        ...overrides,
    };
}

describe('resolveQueueDepthSeverity', () => {
    it('honors API-provided queue_depth.state even when thresholds imply a different severity', () => {
        const queueDepth = buildQueueDepth({
            current_depth: 60,
            thresholds: { warning: 30, critical: 50 },
            state: 'info',
        });

        expect(resolveQueueDepthSeverity(queueDepth)).toBe('info');
    });

    it.each([
        { depth: 29, expected: 'info' },
        { depth: 30, expected: 'warning' },
        { depth: 49, expected: 'warning' },
        { depth: 50, expected: 'critical' },
    ])(
        'falls back to threshold-derived severity when API state is malformed (depth=$depth)',
        ({ depth, expected }) => {
            const queueDepth = buildQueueDepth({
                current_depth: depth,
                state: 'unsupported' as DashboardStatusResponse['queue_depth']['state'],
            });

            expect(resolveQueueDepthSeverity(queueDepth)).toBe(expected);
        }
    );
});
