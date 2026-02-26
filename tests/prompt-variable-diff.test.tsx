import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptVariableDiff, type PromptVariableChange } from '../src/components/config/PromptVariableDiff';
import React from 'react';

const mockChanges: PromptVariableChange[] = [
    {
        key: 'ANCHOR_TONE',
        oldValue: 'Professional, calm, and informative.',
        newValue: 'Professional, upbeat, and informative.',
    },
    {
        key: 'STATION_ID_FREQUENCY',
        oldValue: 'Every 30 minutes',
        newValue: 'Every 15 minutes',
    },
    {
        key: 'NEW_VARIABLE',
        oldValue: null,
        newValue: 'This is a new variable added to the configuration.',
    }
];

describe('PromptVariableDiff', () => {
    it('renders the diff view with old and new values', () => {
        render(<PromptVariableDiff changes={mockChanges} onApprove={vi.fn()} onReject={vi.fn()} />);
        
        expect(screen.getByText('ANCHOR_TONE')).toBeDefined();
        expect(screen.getByText('Professional, calm, and informative.')).toBeDefined();
        expect(screen.getByText('Professional, upbeat, and informative.')).toBeDefined();
        
        expect(screen.getByText('STATION_ID_FREQUENCY')).toBeDefined();
        expect(screen.getByText('Every 30 minutes')).toBeDefined();
        expect(screen.getByText('Every 15 minutes')).toBeDefined();

        expect(screen.getByText('NEW_VARIABLE')).toBeDefined();
        expect(screen.getByText('Not Set')).toBeDefined();
        expect(screen.getByText('This is a new variable added to the configuration.')).toBeDefined();
    });

    it('allows toggling individual changes and approving the selection', () => {
        const onApprove = vi.fn();
        render(<PromptVariableDiff changes={mockChanges} onApprove={onApprove} onReject={vi.fn()} />);
        
        // Uncheck the second change
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(3);
        
        fireEvent.click(checkboxes[1]); // Uncheck STATION_ID_FREQUENCY
        
        const approveButton = screen.getByText(/Approve Selected/);
        fireEvent.click(approveButton);
        
        expect(onApprove).toHaveBeenCalledTimes(1);
        const approvedChanges = onApprove.mock.calls[0][0];
        
        expect(approvedChanges).toHaveLength(2);
        expect(approvedChanges[0].key).toBe('ANCHOR_TONE');
        expect(approvedChanges[1].key).toBe('NEW_VARIABLE');
    });

    it('calls onReject when reject button is clicked', () => {
        const onReject = vi.fn();
        render(<PromptVariableDiff changes={mockChanges} onApprove={vi.fn()} onReject={onReject} />);
        
        fireEvent.click(screen.getByText(/Reject All/));
        expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('disables approve button when no changes are selected', () => {
        const onApprove = vi.fn();
        render(<PromptVariableDiff changes={mockChanges} onApprove={onApprove} onReject={vi.fn()} />);
        
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(cb => fireEvent.click(cb)); // Uncheck all
        
        const approveButton = screen.getByText(/Approve Selected \(0\)/);
        expect((approveButton as HTMLButtonElement).disabled).toBe(true);
    });
});
