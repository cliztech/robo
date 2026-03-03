import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReducedMotion, motionSafe } from '../src/hooks/useReducedMotion';

describe('Reduced Motion Hook', () => {
    let matchMedia: any;

    beforeEach(() => {
        matchMedia = vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
        window.matchMedia = matchMedia;
    });

    it('returns false by default', () => {
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });

    it('returns true when media query matches', () => {
        matchMedia.mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('motionSafe returns static class when reduced motion is preferred', () => {
        const result = motionSafe(true, 'animate-spin', 'opacity-50');
        expect(result).toBe('opacity-50');
    });

    it('motionSafe returns animation class when reduced motion is not preferred', () => {
        const result = motionSafe(false, 'animate-spin', 'opacity-50');
        expect(result).toBe('animate-spin');
    });
});
