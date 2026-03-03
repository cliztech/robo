import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DecisionTracePanel, type DecisionTrace } from '../src/components/ai/DecisionTracePanel';
import React from 'react';

const mockDecisions: DecisionTrace[] = [
    {
        id: '1',
        action: 'Inserted Transition Track',
        rationale: 'BPM delta between Track A (128) and Track B (95) exceeded maximum smooth threshold. Selected 110 BPM bridge track.',
        severity: 'info',
        sourceLinks: [{ label: 'Transition Logic v2', url: '/docs/transitions' }],
        timestamp: new Date('2026-02-25T10:00:00Z'),
    },
    {
        id: '2',
        action: 'Dropped Explicit Track',
        rationale: 'Track contains explicit language flag during a family-friendly scheduling block (06:00-18:00).',
        severity: 'critical',
        sourceLinks: [{ label: 'Station Policy: Content', url: '/policy/content' }],
        timestamp: new Date('2026-02-25T10:05:00Z'),
    },
    {
        id: '3',
        action: 'Extended Ad Break',
        rationale: 'Listener count reached peak threshold, optimized yield by extending break by 30 seconds.',
        severity: 'warning',
        sourceLinks: [],
        timestamp: new Date('2026-02-25T10:10:00Z'),
    },
    { id: '4', action: 'D4', rationale: 'R4', severity: 'info', sourceLinks: [], timestamp: new Date('2026-02-25T09:00:00Z') },
    { id: '5', action: 'D5', rationale: 'R5', severity: 'info', sourceLinks: [], timestamp: new Date('2026-02-25T08:00:00Z') },
    { id: '6', action: 'D6', rationale: 'R6', severity: 'info', sourceLinks: [], timestamp: new Date('2026-02-25T07:00:00Z') },
];

describe('DecisionTracePanel', () => {
    it('renders the latest 5 decisions when unfiltered', () => {
        render(<DecisionTracePanel decisions={mockDecisions} />);
        
        expect(screen.getByText('Inserted Transition Track')).toBeDefined();
        expect(screen.getByText('Dropped Explicit Track')).toBeDefined();
        expect(screen.getByText('Extended Ad Break')).toBeDefined();
        
        // Latest 5 sorted descending: 3, 2, 1, 4, 5. So 6 should not be rendered.
        expect(screen.queryByText('D6')).toBeNull();
    });

    it('displays rationale and source links', () => {
        render(<DecisionTracePanel decisions={mockDecisions} />);
        
        expect(screen.getByText('BPM delta between Track A (128) and Track B (95) exceeded maximum smooth threshold. Selected 110 BPM bridge track.')).toBeDefined();
        expect(screen.getByText('Station Policy: Content')).toBeDefined();
    });

    it('filters decisions by severity', () => {
        render(<DecisionTracePanel decisions={mockDecisions} />);
        
        const filterSelect = screen.getByLabelText('Filter by severity');
        
        fireEvent.change(filterSelect, { target: { value: 'critical' } });
        
        expect(screen.getByText('Dropped Explicit Track')).toBeDefined();
        expect(screen.queryByText('Inserted Transition Track')).toBeNull();
        expect(screen.queryByText('Extended Ad Break')).toBeNull();
    });
});
