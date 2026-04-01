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

export type AiApiErrorCode =
  | 'AI_API_TIMEOUT'
  | 'AI_API_ABORTED'
  | 'AI_API_HTTP_ERROR'
  | 'AI_API_NETWORK_ERROR';

export class AiApiError extends Error {
  code: AiApiErrorCode;
  correlationId: string;
  diagnostics?: {
    abortReason?: string;
    timeoutMs?: number;
    causeMessage?: string;
  };

  constructor(
    code: AiApiErrorCode,
    message: string,
    correlationId: string,
    diagnostics?: AiApiError['diagnostics']
  ) {
    super(message);
    this.name = 'AiApiError';
    this.code = code;
    this.correlationId = correlationId;
    this.diagnostics = diagnostics;
  }
}

function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapFetchError(error: unknown, correlationId: string, timeoutMs: number): AiApiError {
  const causeMessage = error instanceof Error ? error.message : String(error);

  if (error instanceof AiApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AiApiError('AI_API_ABORTED', 'Request was aborted', correlationId, {
      abortReason: causeMessage,
      timeoutMs,
      causeMessage,
    });
  }

  return new AiApiError('AI_API_NETWORK_ERROR', `Network request failed: ${causeMessage}`, correlationId, {
    timeoutMs,
    causeMessage,
  });
}

async function postJSON<TResponse>(
  url: string,
  body: object,
  timeoutMs = 4000
): Promise<ApiResult<TResponse>> {
  const correlationId = createCorrelationId();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort(`timeout:${timeoutMs}ms`);
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new AiApiError(
        'AI_API_HTTP_ERROR',
        errorBody.detail ?? `Request failed with status ${response.status}`,
        correlationId
      );
    }

    const parsed = (await response.json()) as TResponse;
    return { response: parsed, correlationId };
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      throw new AiApiError('AI_API_TIMEOUT', 'Request timed out', correlationId, {
        abortReason: String(controller.signal.reason ?? 'unknown'),
        timeoutMs,
        causeMessage: error instanceof Error ? error.message : String(error),
      });
    }

    throw mapFetchError(error, correlationId, timeoutMs);
  } finally {
    clearTimeout(timeoutHandle);
  }
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
