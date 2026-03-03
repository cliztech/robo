import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueueRiskCards, type QueueRisk } from '../src/components/queue/QueueRiskCards';
import React from 'react';

describe('QueueRiskCards', () => {
    it('renders nothing when there are no risks', () => {
        const { container } = render(<QueueRiskCards risks={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders risk cards with confidence, why, and mitigation', () => {
        const risks: QueueRisk[] = [
            {
                id: 'r1',
                confidence: 0.85,
                why: 'Tempo mismatch between current track and next track is too high (15 BPM).',
                mitigation: 'Enable sync or insert a transition track.',
                severity: 'medium',
            }
        ];

        render(<QueueRiskCards risks={risks} />);

        expect(screen.getByText('85% confidence')).toBeDefined();
        expect(screen.getByText('Tempo mismatch between current track and next track is too high (15 BPM).')).toBeDefined();
        expect(screen.getByText('Enable sync or insert a transition track.')).toBeDefined();
        expect(screen.getByText('medium Risk')).toBeDefined();
    });

    it('handles multiple risks', () => {
        const risks: QueueRisk[] = [
            {
                id: 'r1',
                confidence: 0.9,
                why: 'Dead air predicted.',
                mitigation: 'Load a track.',
                severity: 'high',
            },
            {
                id: 'r2',
                confidence: 0.4,
                why: 'Explicit content during daytime.',
                mitigation: 'Swap with clean version.',
                severity: 'low',
            }
        ];

        render(<QueueRiskCards risks={risks} />);

        expect(screen.getAllByRole('region')).toHaveLength(1);
        expect(screen.getByText('high Risk')).toBeDefined();
        expect(screen.getByText('low Risk')).toBeDefined();
        expect(screen.getByText('Dead air predicted.')).toBeDefined();
        expect(screen.getByText('Explicit content during daytime.')).toBeDefined();
    });
});
