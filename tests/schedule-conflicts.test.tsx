import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScheduleConflicts, type ConflictHint } from '../src/components/schedule/ScheduleConflicts';
import React from 'react';

describe('ScheduleConflicts', () => {
    it('renders nothing when there are no conflicts', () => {
        const { container } = render(<ScheduleConflicts conflicts={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders conflict reason code and suggested fix', () => {
        const mockConflicts: ConflictHint[] = [
            {
                id: 'c1',
                blockId1: 'b1',
                blockId2: 'b2',
                reasonCode: 'OVERLAP_HARD',
                description: 'News Segment overlaps with Sponsored Ad Break.',
                suggestedFix: 'Truncate News Segment by 2 minutes',
            }
        ];

        render(<ScheduleConflicts conflicts={mockConflicts} />);

        expect(screen.getByText('OVERLAP_HARD')).toBeDefined();
        expect(screen.getByText('News Segment overlaps with Sponsored Ad Break.')).toBeDefined();
        expect(screen.getByText('Truncate News Segment by 2 minutes')).toBeDefined();
    });

    it('calls onApplyFix when the apply button is clicked', () => {
        const applyFix = vi.fn();
        const mockConflicts: ConflictHint[] = [
            {
                id: 'c2',
                blockId1: 'b3',
                blockId2: 'b4',
                reasonCode: 'OVERLAP_SOFT',
                description: 'DJ transition runs 10 seconds into the next hour.',
                suggestedFix: 'Shift next block by 10s',
                onApplyFix: applyFix,
            }
        ];

        render(<ScheduleConflicts conflicts={mockConflicts} />);

        const button = screen.getByRole('button', { name: 'Apply' });
        fireEvent.click(button);

        expect(applyFix).toHaveBeenCalledTimes(1);
    });
});
