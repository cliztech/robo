import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DegenAIHost } from '@/components/ai/DegenAIHost';
import { DegenPersonaManager } from '@/components/ai/DegenPersonaManager';

describe('AI UI integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('generates host script from API and shows correlation id', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        correlation_id: 'corr-ui-1',
        data: { script: 'Generated on-air line', safety_flags: [] },
        error: null,
        latency_ms: 12,
        cost_usd: 0.0002,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<DegenAIHost />);

    await user.type(screen.getByPlaceholderText('Custom prompt for AI host...'), 'Spin the next track');
    await user.click(screen.getByRole('button', { name: /Generate/i }));

    await waitFor(() => expect(screen.getByText('Generated on-air line')).toBeInTheDocument());
    expect(screen.getByText(/correlation=/i).textContent).toMatch(/correlation=[a-z0-9-]+/i);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/ai/host-script',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Correlation-ID': expect.any(String) }),
      })
    );
  });

  it('supports save failure + retry path in persona manager', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'network down' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          correlation_id: 'corr-ui-2',
          data: {
            mood: 'uplifting',
            energy_score: 7,
            talkover_windows_seconds: [8, 60],
            transition_tags: ['station'],
            rationale: 'ok',
          },
          error: null,
          latency_ms: 10,
          cost_usd: 0.0001,
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<DegenPersonaManager />);

    await user.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(screen.getByText('network down')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.getByDisplayValue(/mood=uplifting energy=7/i)).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
