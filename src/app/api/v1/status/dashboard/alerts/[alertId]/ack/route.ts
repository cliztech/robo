import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from '../../../_shared/proxy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  return proxyDashboardRequest(
    request,
    `/api/v1/status/dashboard/alerts/${encodeURIComponent(alertId)}/ack`,
    { method: 'POST' }
  );
}
