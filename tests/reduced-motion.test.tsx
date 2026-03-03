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

    it('updates state when media query changes', () => {
        let changeListener: ((e: MediaQueryListEvent) => void) | null = null;
        const addEventListener = vi.fn((event, listener) => {
            if (event === 'change') {
                changeListener = listener;
            }
        });

        matchMedia.mockImplementation((query: string) => ({
            matches: false,
            addEventListener,
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);

        // Simulate media query change to true
        act(() => {
            if (changeListener) {
                changeListener({ matches: true } as MediaQueryListEvent);
            }
        });
        expect(result.current).toBe(true);

        // Simulate media query change back to false
        act(() => {
            if (changeListener) {
                (changeListener as any)({ matches: false } as MediaQueryListEvent);
            }
        });
        expect(result.current).toBe(false);
    });

    it('cleans up event listener on unmount', () => {
        const removeEventListener = vi.fn();
        let changeListener: ((e: MediaQueryListEvent) => void) | null = null;

        matchMedia.mockImplementation((query: string) => ({
            matches: false,
            addEventListener: (event: string, listener: any) => {
                if (event === 'change') {
                    changeListener = listener;
                }
            },
            removeEventListener,
        }));

        const { unmount } = renderHook(() => useReducedMotion());

        unmount();

        expect(removeEventListener).toHaveBeenCalledWith('change', changeListener);
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
