import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { useReducedMotion, motionSafe } from '../src/hooks/useReducedMotion';

function AnimatedComponent() {
    const prefersReducedMotion = useReducedMotion();
    
    return (
        <div 
            data-testid="spinner"
            className={motionSafe(prefersReducedMotion, 'animate-spin', 'border-t-4')}
        >
            Loading
        </div>
    );
}

describe('Animation State Fallbacks', () => {
    it('applies fallback static visual state instead of animation when reduced motion active', () => {
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })));

        render(<AnimatedComponent />);
        
        const el = screen.getByTestId('spinner');
        expect(el.className).toBe('border-t-4');
    });
});
