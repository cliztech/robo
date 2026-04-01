import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  generateHostScript,
  analyzeTrack,
  HostScriptRequest,
  TrackAnalysisRequest,
  AiApiError,
} from '../../src/lib/aiApi';

describe('aiApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    if (!global.crypto) {
      (global as any).crypto = {};
    }
    global.crypto.randomUUID = vi.fn(() => 'mock-uuid-1234');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('generateHostScript', () => {
    const mockRequest: HostScriptRequest = {
      message_type: 'intro',
      prompt: 'Welcome to the show',
      persona_name: 'DJ Test',
      persona_style: 'Energetic',
      voice: 'voice-1',
    };

    it('returns successful response', async () => {
      const mockResponseData = {
        success: true,
        correlation_id: 'mock-uuid-1234',
        data: { script: 'Hello world', safety_flags: [] },
        error: null,
        latency_ms: 100,
        cost_usd: 0.01,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      });

      const result = await generateHostScript(mockRequest);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/ai/host-script',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'mock-uuid-1234',
          }),
          body: JSON.stringify(mockRequest),
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual({
        response: mockResponseData,
        correlationId: 'mock-uuid-1234',
      });
    });

    it('throws HTTP error code when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' }),
      });

      await expect(generateHostScript(mockRequest)).rejects.toMatchObject({
        name: 'AiApiError',
        code: 'AI_API_HTTP_ERROR',
        message: 'Internal Server Error',
        correlationId: 'mock-uuid-1234',
      });
    });

    it('maps timeout to deterministic timeout code and includes abort reason', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockImplementationOnce(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          })
      );

      const errorResult = generateHostScript(mockRequest).catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(4000);

      const error = await errorResult;
      expect(error).toBeInstanceOf(AiApiError);
      expect(error).toMatchObject({
        code: 'AI_API_TIMEOUT',
        message: 'Request timed out',
        diagnostics: expect.objectContaining({
          abortReason: 'timeout:4000ms',
          timeoutMs: 4000,
        }),
      });
    });

    it('does not double-resolve or emit unhandled rejection after timeout abort', async () => {
      vi.useFakeTimers();

      const unhandledRejections: unknown[] = [];
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason);
      };
      process.on('unhandledRejection', onUnhandledRejection);

      (global.fetch as any).mockImplementationOnce(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
            setTimeout(() => reject(new Error('late provider failure')), 4500);
          })
      );

      const errorResult = generateHostScript(mockRequest).catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(4000);
      expect(await errorResult).toMatchObject({ code: 'AI_API_TIMEOUT' });
      await vi.advanceTimersByTimeAsync(1000);

      process.off('unhandledRejection', onUnhandledRejection);
      expect(unhandledRejections).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeTrack', () => {
    const mockRequest: TrackAnalysisRequest = {
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Pop',
      bpm: 120,
      duration_seconds: 180,
      notes: '',
    };

    it('returns successful response', async () => {
      const mockResponseData = {
        success: true,
        correlation_id: 'mock-uuid-1234',
        data: {
          mood: 'happy',
          energy_score: 80,
          talkover_windows_seconds: [10, 20],
          transition_tags: ['upbeat'],
          rationale: 'Good song',
        },
        error: null,
        latency_ms: 200,
        cost_usd: 0.02,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      });

      const result = await analyzeTrack(mockRequest);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/ai/track-analysis',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'mock-uuid-1234',
          }),
          body: JSON.stringify(mockRequest),
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual({
        response: mockResponseData,
        correlationId: 'mock-uuid-1234',
      });
    });

    it('throws HTTP error code when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad Request' }),
      });

      await expect(analyzeTrack(mockRequest)).rejects.toMatchObject({
        code: 'AI_API_HTTP_ERROR',
        message: 'Bad Request',
      });
    });
  });
});
