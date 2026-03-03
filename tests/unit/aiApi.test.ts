import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { generateHostScript, analyzeTrack, HostScriptRequest, TrackAnalysisRequest } from '../../src/lib/aiApi';

describe('aiApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    // Mock crypto.randomUUID
    if (!global.crypto) {
      (global as any).crypto = {};
    }
    global.crypto.randomUUID = vi.fn(() => 'mock-uuid-1234');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
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
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/ai/host-script', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Correlation-ID': 'mock-uuid-1234',
        }),
        body: JSON.stringify(mockRequest),
      }));
      expect(result).toEqual({
        response: mockResponseData,
        correlationId: 'mock-uuid-1234',
      });
    });

    it('throws error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' }),
      });

      await expect(generateHostScript(mockRequest)).rejects.toThrow('Internal Server Error');
    });

    it('throws generic error when response is not ok and JSON parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => { throw new Error('Failed to parse json'); },
      });

      await expect(generateHostScript(mockRequest)).rejects.toThrow('Unknown error');
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
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/ai/track-analysis', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Correlation-ID': 'mock-uuid-1234',
        }),
        body: JSON.stringify(mockRequest),
      }));
      expect(result).toEqual({
        response: mockResponseData,
        correlationId: 'mock-uuid-1234',
      });
    });

    it('throws error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad Request' }),
      });

      await expect(analyzeTrack(mockRequest)).rejects.toThrow('Bad Request');
    });
  });
});
