import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface ProxySession {
  userId: string;
  accessToken: string;
}

interface ProxyErrorEnvelope {
  detail: string;
  status: number;
  code?: string;
}

const DEFAULT_BACKEND_BASE_URL = 'http://127.0.0.1:5000';

function resolveBackendBaseUrl(): string {
  return (
    process.env.DASHBOARD_STATUS_BACKEND_URL ??
    process.env.INTERNAL_API_BASE_URL ??
    DEFAULT_BACKEND_BASE_URL
  ).replace(/\/$/, '');
}

function buildErrorEnvelope(status: number, detail: string, code?: string): ProxyErrorEnvelope {
  return { status, detail, code };
}

async function requireSession(): Promise<ProxySession | NextResponse> {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(buildErrorEnvelope(401, 'Unauthorized', 'AUTH_REQUIRED'), { status: 401 });
  }

  return {
    userId: session.user.id,
    accessToken: session.access_token,
  };
}

function normalizeBackendError(status: number, payload: unknown): ProxyErrorEnvelope {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const detail = record.detail ?? record.error ?? record.message;
    const code = typeof record.code === 'string' ? record.code : undefined;

    if (typeof detail === 'string' && detail.length > 0) {
      return buildErrorEnvelope(status, detail, code);
    }
  }

  return buildErrorEnvelope(status, `Dashboard backend request failed with status ${status}`);
}

export async function proxyDashboardRequest(request: NextRequest, path: string, init?: RequestInit): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const backendUrl = `${resolveBackendBaseUrl()}${path}`;
  const upstreamResponse = await fetch(backendUrl, {
    method: init?.method ?? request.method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'X-User-Id': session.userId,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
    body: init?.body ?? request.body,
  });

  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await upstreamResponse.json().catch(() => ({}))
    : { detail: await upstreamResponse.text() };

  if (!upstreamResponse.ok) {
    const normalized = normalizeBackendError(upstreamResponse.status, payload);
    return NextResponse.json(normalized, { status: upstreamResponse.status });
  }

  return NextResponse.json(payload, { status: upstreamResponse.status });
}
