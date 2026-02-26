export type AIMessageType = 'intro' | 'outro' | 'commentary' | 'news';

export interface HostScriptRequest {
  message_type: AIMessageType;
  prompt: string;
  persona_name: string;
  persona_style: string;
  voice: string;
}

export interface HostScriptResponse {
  success: boolean;
  correlation_id: string;
  data: {
    script: string;
    safety_flags: string[];
  } | null;
  error: string | null;
  latency_ms: number;
  cost_usd: number;
}

export interface TrackAnalysisRequest {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration_seconds: number;
  notes: string;
}

export interface TrackAnalysisResponse {
  success: boolean;
  correlation_id: string;
  data: {
    mood: string;
    energy_score: number;
    talkover_windows_seconds: number[];
    transition_tags: string[];
    rationale: string;
  } | null;
  error: string | null;
  latency_ms: number;
  cost_usd: number;
}

export interface ApiResult<T> {
  response: T;
  correlationId: string;
}

function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function postJSON<TResponse>(url: string, body: object): Promise<ApiResult<TResponse>> {
  const correlationId = createCorrelationId();
  const response = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(body),
    })
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorBody.detail ?? `Request failed with status ${response.status}`);
  }

  const parsed = (await response.json()) as TResponse;
  return { response: parsed, correlationId };
}

export function generateHostScript(
  request: HostScriptRequest
): Promise<ApiResult<HostScriptResponse>> {
  return postJSON<HostScriptResponse>('/api/v1/ai/host-script', request);
}

export function analyzeTrack(
  request: TrackAnalysisRequest
): Promise<ApiResult<TrackAnalysisResponse>> {
  return postJSON<TrackAnalysisResponse>('/api/v1/ai/track-analysis', request);
}
