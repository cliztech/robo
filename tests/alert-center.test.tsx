import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AlertCenter, type AlertMessage } from '../src/components/alerts/AlertCenter';
import React from 'react';

const mockAlerts: AlertMessage[] = [
    {
        id: '1',
        severity: 'critical',
        message: 'Master database connection lost.',
        impact: 'Schedules cannot be loaded. Auto-DJ will stop playing after the current track.',
        remediationCTA: 'Switch to Local Cache',
    },
    {
        id: '2',
        severity: 'warning',
        message: 'Audio input clipping detected on Deck A.',
        impact: 'Distorted audio is broadcasting to listeners.',
        remediationCTA: 'Enable Auto-Limiter',
    }
];

describe('AlertCenter', () => {
    it('renders nothing when there are no alerts', () => {
        const { container } = render(<AlertCenter alerts={[]} onDismiss={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('displays severity, impact, and actionable remediation CTA', () => {
        render(<AlertCenter alerts={mockAlerts} onDismiss={vi.fn()} />);
        
        expect(screen.getByText('critical')).toBeDefined();
        expect(screen.getByText('Master database connection lost.')).toBeDefined();
        expect(screen.getByText('Schedules cannot be loaded. Auto-DJ will stop playing after the current track.')).toBeDefined();
        expect(screen.getByText('Switch to Local Cache')).toBeDefined();

        expect(screen.getByText('warning')).toBeDefined();
        expect(screen.getByText('Audio input clipping detected on Deck A.')).toBeDefined();
        expect(screen.getByText('Distorted audio is broadcasting to listeners.')).toBeDefined();
        expect(screen.getByText('Enable Auto-Limiter')).toBeDefined();
    });

    it('calls onDismiss when close button is clicked', () => {
        const onDismiss = vi.fn();
        render(<AlertCenter alerts={mockAlerts} onDismiss={onDismiss} />);
        
        const dismissButtons = screen.getAllByLabelText(/Dismiss.*alert/i);
        fireEvent.click(dismissButtons[0]);
        
        expect(onDismiss).toHaveBeenCalledWith('1');
    });

    it('calls onRemediate when CTA is clicked', () => {
        const onRemediate = vi.fn();
        const alertWithRemediate: AlertMessage = {
            ...mockAlerts[0],
            onRemediate
        };

        render(<AlertCenter alerts={[alertWithRemediate]} onDismiss={vi.fn()} />);
        
        const ctaButton = screen.getByLabelText('Switch to Local Cache');
        fireEvent.click(ctaButton);
        
        expect(onRemediate).toHaveBeenCalledTimes(1);
    });
});
