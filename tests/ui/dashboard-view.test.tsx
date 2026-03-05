import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView, type DashboardViewApi } from "@/components/console/DashboardView";
import type { AlertCenterItem, DashboardStatusResponse } from "@/lib/status/dashboardClient";

function buildAlerts(): AlertCenterItem[] {
  return [
    {
      alert_id: "alert-queue-critical",
      severity: "critical",
      title: "Queue depth above critical threshold",
      description: "Queue depth has exceeded 50 items for over 5 minutes.",
      created_at: "2026-02-26T11:53:00.000Z",
      acknowledged: false,
      acknowledged_at: null,
    },
  ];
}

function buildStatus(reason = "queue depth above critical threshold"): DashboardStatusResponse {
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
    },
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
});
