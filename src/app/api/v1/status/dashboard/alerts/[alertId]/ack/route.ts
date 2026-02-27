import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from '../../../../_shared/proxy';

interface AlertAckParams {
  params: Promise<{ alertId: string }>;
}

export async function POST(request: NextRequest, context: AlertAckParams) {
  const { alertId } = await context.params;
  return proxyDashboardRequest(
    request,
    `/api/v1/status/dashboard/alerts/${encodeURIComponent(alertId)}/ack`,
    { method: 'POST' }
  );
}
