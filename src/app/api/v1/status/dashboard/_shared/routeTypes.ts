import type { NextRequest } from 'next/server';

export type StatusProxyRouteHandler = (request: NextRequest) => Promise<Response>;

export type AppRouteParamsContext<TParams extends Record<string, string>> = {
  params: TParams;
};

