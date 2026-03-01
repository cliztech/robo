import re

with open('tests/reduced-motion.test.tsx', 'r') as f:
    content = f.read()

search = """    it('returns true when media query matches', () => {
        matchMedia.mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('motionSafe returns static class when reduced motion is preferred', () => {"""

replace = """    it('returns true when media query matches', () => {
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
                (changeListener as any)({ matches: true } as MediaQueryListEvent);
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

    it('motionSafe returns static class when reduced motion is preferred', () => {"""

if search in content:
    new_content = content.replace(search, replace)
    with open('tests/reduced-motion.test.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Search string not found.")
