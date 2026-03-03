import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from '../_shared/proxy';

export async function GET(request: NextRequest) {
  const severity = request.nextUrl.searchParams.get('severity');
  const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';

  return proxyDashboardRequest(request, `/api/v1/status/dashboard/alerts${query}`);
}
