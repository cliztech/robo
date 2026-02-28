import { describe, expect, it } from 'vitest';
import {
    DEFAULT_SKIN,
    MAX_SKIN_ASSET_SIZE_BYTES,
    detectMissingTokens,
    isAssetSizeAllowed,
    validateSkinManifest,
} from '@/lib/theme/skinLoader';

describe('skin loader', () => {
    it('validates a complete manifest', () => {
        const result = validateSkinManifest({
            id: 'vendor.midnight',
            name: 'Midnight',
            version: '1.1.0',
            author: 'Vendor',
            compatibility: {
                min_app_version: '1.0.0',
                max_app_version: '2.0.0',
            },
            tokens: {
                color_bg: '240 10% 2%',
                color_surface: '240 6% 7%',
                color_text: '210 20% 98%',
                color_accent: '207 98% 45%',
                color_deck_a: '207 98% 45%',
                color_deck_b: '207 81% 79%',
                radius_md: '8px',
                shadow_soft: '0 2px 8px hsl(0 0 0% / 0.2)',
            },
        });

        expect(result.valid).toBe(true);
        expect(result.fallbackApplied).toBe(false);
        expect(result.manifest.id).toBe('vendor.midnight');
    });

    it('falls back when required tokens are missing', () => {
        const result = validateSkinManifest({
            id: 'vendor.invalid',
            name: 'Invalid',
            version: '1.1.0',
            author: 'Vendor',
            compatibility: {
                min_app_version: '1.0.0',
                max_app_version: '2.0.0',
            },
            tokens: {
                color_bg: '240 10% 2%',
            },
        });

        expect(result.valid).toBe(false);
        expect(result.fallbackApplied).toBe(true);
        expect(result.manifest.id).toBe(DEFAULT_SKIN.id);
        expect(result.missingTokens.length).toBeGreaterThan(0);
    });

    it('rejects non-sandboxed assets and script fields', () => {
        const result = validateSkinManifest({
            id: 'vendor.invalid.script',
            name: 'Invalid',
            version: '1.1.0',
            author: 'Vendor',
            compatibility: {
                min_app_version: '1.0.0',
                max_app_version: '2.0.0',
            },
            script: 'alert(1)',
            tokens: {
                color_bg: '240 10% 2%',
                color_surface: '240 6% 7%',
                color_text: '210 20% 98%',
                color_accent: '207 98% 45%',
                color_deck_a: '207 98% 45%',
                color_deck_b: '207 81% 79%',
                radius_md: '8px',
                shadow_soft: '0 2px 8px hsl(0 0 0% / 0.2)',
            },
            assets: {
                fonts: ['https://bad.example/font.woff2'],
            },
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toContain('script');
        expect(result.errors.join(' ')).toContain('unsupported path');
    });

    it('enforces file-size constraints', () => {
        expect(isAssetSizeAllowed(MAX_SKIN_ASSET_SIZE_BYTES)).toBe(true);
        expect(isAssetSizeAllowed(MAX_SKIN_ASSET_SIZE_BYTES + 1)).toBe(false);
    });

    it('detects missing token mappings', () => {
        expect(detectMissingTokens({ color_bg: 'x' }).length).toBeGreaterThan(0);
    });
});
