import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlertCenter, type AlertMessage } from '../src/components/alerts/AlertCenter';
import React from 'react';

const mockAlerts: AlertMessage[] = [
    {
        id: '1',
        severity: 'info',
        message: 'System update available.',
        impact: 'New features and security patches will be applied.',
        remediationCTA: 'Apply Update Now',
    }
];

describe('Accessibility Alerts', () => {
    it('has polite aria-live region', () => {
        render(<AlertCenter alerts={mockAlerts} onDismiss={() => {}} />);
        const region = screen.getByRole('region', { name: 'Alert Center' });
        expect(region.getAttribute('aria-live')).toBe('polite');
    });

    it('has accessible dismiss buttons', () => {
        render(<AlertCenter alerts={mockAlerts} onDismiss={() => {}} />);
        const dismissButton = screen.getByRole('button', { name: 'Dismiss info alert' });
        expect(dismissButton).toBeDefined();
    });

    it('has accessible CTA buttons', () => {
        render(<AlertCenter alerts={mockAlerts} onDismiss={() => {}} />);
        const ctaButton = screen.getByRole('button', { name: 'Apply Update Now' });
        expect(ctaButton).toBeDefined();
    });
});
