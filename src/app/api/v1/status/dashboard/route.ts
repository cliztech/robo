import { NextRequest } from 'next/server';
import { proxyDashboardRequest } from './_shared/proxy';

export async function GET(request: NextRequest) {
  return proxyDashboardRequest(request, '/api/v1/status/dashboard');
}
