import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from './_shared/proxy';
import type { StatusProxyRouteHandler } from './_shared/routeTypes';

export const GET: StatusProxyRouteHandler = async (request: NextRequest) => {
  return proxyDashboardRequest(request, '/api/v1/status/dashboard');
};
