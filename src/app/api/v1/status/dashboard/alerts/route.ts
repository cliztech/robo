import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from '../_shared/proxy';
import type { StatusProxyRouteHandler } from '../_shared/routeTypes';

export const GET: StatusProxyRouteHandler = async (request: NextRequest) => {
  const severity = request.nextUrl.searchParams.get('severity');
  const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';

  return proxyDashboardRequest(request, `/api/v1/status/dashboard/alerts${query}`);
};
