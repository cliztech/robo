import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardMap, type KeyBinding } from '../src/hooks/useKeyboardMap';
import React from 'react';

function TestComponent({ bindings }: { bindings: KeyBinding[] }) {
    useKeyboardMap({ bindings });
    return <div data-testid="test-container">Keyboard Map Active</div>;
}

describe('Global Keyboard Map', () => {
    it('triggers action when correct key combination is pressed', () => {
        const playAction = vi.fn();
        const loadAction = vi.fn();
        
        const bindings: KeyBinding[] = [
            { key: ' ', action: playAction, description: 'Play/Pause', category: 'transport' },
            { key: 'ArrowRight', shift: true, action: loadAction, description: 'Load to Deck', category: 'browser' }
        ];

        render(<TestComponent bindings={bindings} />);
        
        fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        expect(playAction).toHaveBeenCalledTimes(1);
        
        fireEvent.keyDown(window, { key: 'ArrowRight', shiftKey: true });
        expect(loadAction).toHaveBeenCalledTimes(1);
    });

    it('ignores input when typing in form fields', () => {
        const playAction = vi.fn();
        
        const bindings: KeyBinding[] = [
            { key: ' ', action: playAction, description: 'Play/Pause', category: 'transport' }
        ];

        render(
            <div>
                <TestComponent bindings={bindings} />
                <input type="text" data-testid="search-input" />
            </div>
        );
        
        const input = screen.getByTestId('search-input');
        fireEvent.keyDown(input, { key: ' ', code: 'Space' });
        
        expect(playAction).not.toHaveBeenCalled();
    });

    it('requires exact modifier match', () => {
        const action = vi.fn();
        
        const bindings: KeyBinding[] = [
            { key: 'p', ctrl: true, action, description: 'Test', category: 'global' }
        ];

        render(<TestComponent bindings={bindings} />);
        
        // Missing ctrl
        fireEvent.keyDown(window, { key: 'p' });
        expect(action).not.toHaveBeenCalled();
        
        // Correct combination
        fireEvent.keyDown(window, { key: 'p', ctrlKey: true });
        expect(action).toHaveBeenCalledTimes(1);
    });
});
