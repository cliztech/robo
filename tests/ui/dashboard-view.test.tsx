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

import { describe, expect, it, vi } from 'vitest';
import { DashboardView, parseDashboardTelemetryFallback, resolveQueueDepthSeverity, type DashboardViewApi } from '@/components/console/DashboardView';
import type { AlertCenterItem, DashboardStatusResponse } from '@/lib/status/dashboardClient';

function buildStatus(overrides: Partial<DashboardStatusResponse> = {}): DashboardStatusResponse {
  return {
    service_health: {
      status: "degraded",
      reason,
      observed_at: "2026-02-26T12:00:00.000Z",
    },
    queue_depth: {
      current_depth: 54,
      trend: [{ timestamp: "2026-02-26T12:00:00.000Z", depth: 54 }],
      thresholds: { warning: 30, critical: 50 },
      state: "critical",
    },
    rotation: {
      last_successful_rotation_at: "2026-02-26T11:13:00.000Z",
      stale_after_minutes: 30,
      is_stale: true,
      stale_reason: "rotation worker has not published a successful run",
    },
    alert_center: {
      filters: ["critical", "warning", "info"],
      items: buildAlerts(),
      filters: ['info', 'warning', 'critical'],
      items: buildAlerts(),
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
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function buildApi(overrides: Partial<DashboardViewApi> = {}): DashboardViewApi {
  return {
    fetchDashboardStatus: vi.fn().mockResolvedValue(buildStatus()),
    fetchDashboardAlerts: vi.fn().mockResolvedValue(buildAlerts()),
    acknowledgeDashboardAlert: vi.fn().mockResolvedValue({
      ...buildAlerts()[0],
      acknowledged: true,
      acknowledged_at: "2026-02-26T12:05:00.000Z",
    }),
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

describe("DashboardView", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("handles initial load", async () => {
    const api = buildApi();
    render(<DashboardView api={api} />);

    expect(screen.getByText("Loading status telemetry…")).toBeInTheDocument();
    expect(await screen.findByText("queue depth above critical threshold")).toBeInTheDocument();
  });

  it("handles failed load", async () => {
    const api = buildApi({
      fetchDashboardStatus: vi.fn().mockRejectedValue(new Error("status endpoint unavailable")),
    });

    render(<DashboardView api={api} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Status API unavailable: status endpoint unavailable",
    );
  });

  it("refreshes via polling", async () => {
    const statusMock = vi
      .fn<DashboardViewApi["fetchDashboardStatus"]>()
      .mockResolvedValueOnce(buildStatus("first reason"))
      .mockResolvedValueOnce(buildStatus("second reason"));
    const api = buildApi({ fetchDashboardStatus: statusMock });

    render(<DashboardView api={api} pollIntervalMs={20} />);

    expect(await screen.findByText("first reason")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("second reason")).toBeInTheDocument();
    });
    expect(statusMock).toHaveBeenCalledTimes(2);
  });

  it("rolls back optimistic acknowledge on error", async () => {
    const user = userEvent.setup();
    const pendingAck = deferred<AlertCenterItem>();
    const api = buildApi({
      acknowledgeDashboardAlert: vi.fn().mockReturnValue(pendingAck.promise),
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

    expect(screen.getAllByRole('button', { name: 'Acknowledge' })[0]).toBeEnabled();
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
    render(<DashboardView api={api} />);

    const button = await screen.findByRole("button", { name: "Acknowledge" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Acknowledged" })).toBeInTheDocument();

    pendingAck.reject(new Error("ack failed"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
    });
  });

  it("prevents duplicate acknowledge requests", async () => {
    const user = userEvent.setup();
    const pendingAck = deferred<AlertCenterItem>();
    const ackMock = vi.fn().mockReturnValue(pendingAck.promise);
    const api = buildApi({ acknowledgeDashboardAlert: ackMock });

    render(<DashboardView api={api} />);

    const button = await screen.findByRole("button", { name: "Acknowledge" });
    await user.click(button);
    await user.click(button);

    expect(ackMock).toHaveBeenCalledTimes(1);

    pendingAck.resolve({ ...buildAlerts()[0], acknowledged: true, acknowledged_at: "2026-02-26T12:11:00.000Z" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Acknowledged" })).toBeInTheDocument();
    });
  });
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
