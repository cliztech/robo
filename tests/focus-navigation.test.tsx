import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// A mock layout to test tab sequence and focus
function MockConsoleLayout() {
    return (
        <div>
            <nav aria-label="Global Navigation">
                <button aria-label="Menu">Menu</button>
            </nav>
            <main>
                <section aria-label="Deck A">
                    <button>Play A</button>
                    <button>Cue A</button>
                </section>
                <section aria-label="Deck B">
                    <button>Play B</button>
                    <button>Cue B</button>
                </section>
                <section aria-label="Browser">
                    <input type="search" placeholder="Search..." />
                    <button>Load to A</button>
                </section>
            </main>
        </div>
    );
}

describe('Focus Navigation', () => {
    it('allows sequential focus navigation through primary zones', async () => {
        const user = userEvent.setup();
        render(<MockConsoleLayout />);
        
        await user.tab();
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('button', { name: 'Play A' })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('button', { name: 'Cue A' })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('button', { name: 'Play B' })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('button', { name: 'Cue B' })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('searchbox')).toHaveFocus();
    });
});
