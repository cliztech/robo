import { useState, useEffect } from 'react';

export function useReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
}

// Utility to merge variants conditionally based on motion preference
export function motionSafe(
    prefersReducedMotion: boolean,
    animationClass: string,
    staticClass: string = ''
) {
    return prefersReducedMotion ? staticClass : animationClass;
}
