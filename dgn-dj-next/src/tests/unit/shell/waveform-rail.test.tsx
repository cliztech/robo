import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaveformRail } from '../../../components/shell/waveform-rail';
import React from 'react';

// Mock Canvas and RequestAnimationFrame
if (typeof window !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        strokeRect: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 0 }),
    });

    window.requestAnimationFrame = vi.fn();
    window.cancelAnimationFrame = vi.fn();
    window.devicePixelRatio = 1;
}

describe('WaveformRail', () => {
    it('renders the overview container', () => {
        render(<WaveformRail />);
        expect(screen.getByText('Overview')).toBeDefined();
    });

    it('handles reduced motion by not starting animation loop', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        render(<WaveformRail reducedMotion={true} playingA={true} />);
        
        // Initial render still calls raf if not careful, but subsequent shouldn't
        // In our impl, if reducedMotion is true, it only renders once.
        // Wait, the hook runs once on mount anyway.
        // Let's check if playingA={true} triggers RAF when reducedMotion is true.
        expect(rafSpy).not.toHaveBeenCalled();
    });

    it('starts animation loop when playing and motion enabled', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        render(<WaveformRail reducedMotion={false} playingA={true} />);
        expect(rafSpy).toHaveBeenCalled();
    });

    it('renders dual lanes with correct state feedback', () => {
        const { container } = render(<WaveformRail posA={0.5} posB={0.2} />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeDefined();
        // Since we mock context, we can check if fillRect etc were called
        const ctx = canvas?.getContext('2d');
        expect(ctx?.fillRect).toHaveBeenCalled();
    });
});
