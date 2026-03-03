import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as getDashboard } from '@/app/api/v1/status/dashboard/route';
import { GET as getAlerts } from '@/app/api/v1/status/dashboard/alerts/route';
import { POST as postAck } from '@/app/api/v1/status/dashboard/alerts/[alertId]/ack/route';
import type { DashboardStatusResponse } from '@/lib/status/dashboardClient';

const getSessionMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: {
      getSession: getSessionMock,
    },
  }),
}));

describe('dashboard status proxy route handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSessionMock.mockReset();
    vi.stubEnv('DASHBOARD_STATUS_BACKEND_URL', 'http://dashboard-service.internal');
  });

  it('returns 401 with normalized envelope when auth session is missing', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const response = await getDashboard(new NextRequest('http://localhost/api/v1/status/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      status: 401,
      detail: 'Unauthorized',
      code: 'AUTH_REQUIRED',
    });
  });

  it('proxies dashboard payload with auth headers and JSON shape compatible with DashboardStatusResponse', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
          access_token: 'mock-token-abc',
        },
      },
    });

    const payload: DashboardStatusResponse = {
      service_health: {
        status: 'healthy',
        reason: 'All services nominal',
        observed_at: '2026-02-27T20:00:00.000Z',
      },
      queue_depth: {
        current_depth: 2,
        trend: [{ timestamp: '2026-02-27T20:00:00.000Z', depth: 2 }],
        thresholds: { warning: 10, critical: 20 },
        state: 'info',
      },
      rotation: {
        last_successful_rotation_at: '2026-02-27T19:58:00.000Z',
        stale_after_minutes: 30,
        is_stale: false,
        stale_reason: null,
      },
      alert_center: {
        filters: ['critical', 'warning', 'info'],
        items: [],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const response = await getDashboard(new NextRequest('http://localhost/api/v1/status/dashboard'));
    const body = (await response.json()) as DashboardStatusResponse;

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://dashboard-service.internal/api/v1/status/dashboard',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'X-User-Id': 'user-1',
        }),
      })
    );
    expect(body.service_health.status).toBe('healthy');
    expect(Array.isArray(body.alert_center.items)).toBe(true);
  });

  it('normalizes backend error envelope on alerts list and preserves status', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-2' },
          access_token: 'mock-token-def',
        },
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Downstream timeout', code: 'UPSTREAM_TIMEOUT' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      })
    );

    const response = await getAlerts(
      new NextRequest('http://localhost/api/v1/status/dashboard/alerts?severity=critical')
    );
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body).toEqual({
      status: 504,
      detail: 'Downstream timeout',
      code: 'UPSTREAM_TIMEOUT',
    });
  });

  it('proxies acknowledge endpoint with encoded alert id', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-3' },
          access_token: 'mock-token-ghi',
        },
      },
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          alert_id: 'alert/1',
          severity: 'warning',
          title: 'Queue high',
          description: 'queue above warning threshold',
          created_at: '2026-02-27T20:00:00.000Z',
          acknowledged: true,
          acknowledged_at: '2026-02-27T20:01:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    const response = await postAck(new NextRequest('http://localhost/api/v1/status/dashboard/alerts/alert%2F1/ack', { method: 'POST' }), {
      params: { alertId: 'alert/1' },
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://dashboard-service.internal/api/v1/status/dashboard/alerts/alert%2F1/ack',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
