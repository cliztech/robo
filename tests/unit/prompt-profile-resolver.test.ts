import { describe, expect, it } from 'vitest';

import { createPromptProfileResolver, resolvePromptProfile } from '@/lib/ai/promptProfileResolver';

describe('promptProfileResolver', () => {
    it('produces identical resolved profile and version for identical configs', () => {
        const config = {
            custom_variables: {
                station_name: 'DGN-DJ by DGNradio',
                analysis_tone: 'technical',
            },
            variable_settings: {
                missing_variable_behavior: 'empty_string',
                override_precedence: 'custom_over_builtin',
            },
            version: '1.1',
        };

        const first = resolvePromptProfile(config);
        const second = resolvePromptProfile(config);

        expect(second).toEqual(first);
        expect(first.promptProfileVersion).toBe(second.promptProfileVersion);
    });

    it('falls back deterministically when expected keys are missing', () => {
        const resolver = createPromptProfileResolver({
            loadConfig: () => ({}),
        });

        const first = resolver({
            trackId: 'track-1',
            title: 'A',
            artist: 'B',
        });

        const second = resolver({
            trackId: 'track-2',
            title: 'C',
            artist: 'D',
        });

        expect(first).toEqual(second);
        expect(first.promptTemplate).toContain('Station: DGN-DJ by DGNradio.');
        expect(first.promptTemplate).toContain('Tone: radio_programming_technical.');
    });
});
