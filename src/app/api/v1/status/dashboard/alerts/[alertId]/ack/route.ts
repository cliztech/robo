import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from '../../../_shared/proxy';
import type { AppRouteParamsContext } from '../../../_shared/routeTypes';

type AlertAckRouteParams = { alertId: string };
type AlertAckRouteContext = AppRouteParamsContext<AlertAckRouteParams>;

export async function POST(request: NextRequest, { params }: AlertAckRouteContext) {
  const { alertId } = params;
  const normalizedAlertId = typeof alertId === 'string' ? alertId.trim() : '';

  if (!normalizedAlertId) {
    return Response.json(
      {
        status: 400,
        detail: 'Invalid alertId',
        code: 'INVALID_ALERT_ID',
      },
      { status: 400 }
    );
  }

  return proxyDashboardRequest(
    request,
    `/api/v1/status/dashboard/alerts/${encodeURIComponent(normalizedAlertId)}/ack`,
    { method: 'POST' }
  );
}
