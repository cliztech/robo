import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardView, type DashboardViewApi, resolveQueueDepthSeverity } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

function buildStatus(): DashboardStatusResponse {
  return {
    service_health: {
      status: 'healthy',
      reason: 'ok',
      observed_at: '2026-02-26T12:00:00.000Z',
    },
    queue_depth: {
      current_depth: 10,
      trend: [{ timestamp: '2026-02-26T12:00:00.000Z', depth: 10 }],
      thresholds: { warning: 30, critical: 50 },
      state: 'info',
    },
    rotation: {
      last_successful_rotation_at: '2026-02-26T11:40:00.000Z',
      stale_after_minutes: 30,
      is_stale: false,
      stale_reason: null,
    },
    alert_center: {
      filters: ['info', 'warning', 'critical'],
      items: [],
    },
  };
}

function buildApi(overrides: Partial<DashboardViewApi> = {}): DashboardViewApi {
  return {
    fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
    fetchDashboardAlerts: vi.fn().mockResolvedValue([] as AlertCenterItem[]),
    acknowledgeDashboardAlert: vi.fn(),
    ...overrides,
  };
}


async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
  });
}
describe('resolveQueueDepthSeverity', () => {
  it('uses API provided state when valid', () => {
    const queueDepth = { ...buildStatus().queue_depth, state: 'warning' as const };
    expect(resolveQueueDepthSeverity(queueDepth)).toBe('warning');
  });

  it('falls back to thresholds when state is malformed', () => {
    const queueDepth = {
      ...buildStatus().queue_depth,
      current_depth: 60,
      state: 'unsupported' as DashboardStatusResponse['queue_depth']['state'],
    };
    expect(resolveQueueDepthSeverity(queueDepth)).toBe('critical');
  });
});

describe('DashboardView polling cadence', () => {
  let visibilityState: DocumentVisibilityState;

  beforeEach(() => {
    vi.useFakeTimers();
    visibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('slows polling when hidden and resumes immediate polling when visible', async () => {
    const api = buildApi();
    render(<DashboardView api={api} pollIntervalMs={1_000} hiddenPollIntervalMs={10_000} />);

    await flushAsync();
    expect(api.fetchDashboardStatus).toHaveBeenCalledTimes(1);

    visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      vi.advanceTimersByTime(1_200);
    });
    expect(api.fetchDashboardStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(9_000);
    });
    await flushAsync();
    expect(api.fetchDashboardStatus).toHaveBeenCalledTimes(2);

    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await flushAsync();
    expect(api.fetchDashboardStatus).toHaveBeenCalledTimes(3);
  });

  it('backs off after failures and resets to base cadence on success', async () => {
    const fetchDashboardStatus = vi
      .fn<DashboardViewApi['fetchDashboardStatus']>()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue(buildStatus())
      .mockResolvedValue(buildStatus());

    const api = buildApi({ fetchDashboardStatus });
    render(<DashboardView api={api} pollIntervalMs={1_000} hiddenPollIntervalMs={20_000} />);

    await flushAsync();
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1_400);
    });
    await flushAsync();
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(2_400);
    });
    await flushAsync();
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(3);

    await act(async () => {
      vi.advanceTimersByTime(1_200);
    });
    await flushAsync();
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(4);
  });

  it('aborts in-flight request on unmount and does not overlap polls', async () => {
    let capturedSignal: AbortSignal | null = null;
    let resolveStatus: ((value: DashboardStatusResponse) => void) | null = null;

    const fetchDashboardStatus = vi.fn((signal?: AbortSignal) => {
      capturedSignal = signal ?? null;
      return new Promise<DashboardStatusResponse>((resolve) => {
        resolveStatus = resolve;
      });
    });

    const api = buildApi({ fetchDashboardStatus });
    const { unmount } = render(
      <DashboardView api={api} pollIntervalMs={1_000} hiddenPollIntervalMs={20_000} />,
    );

    await flushAsync();
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(fetchDashboardStatus).toHaveBeenCalledTimes(1);

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);

    resolveStatus?.(buildStatus());
  });
});
