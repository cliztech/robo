import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioPage from '@/app/page';

describe('StudioPage', () => {
  it('switches views from sidebar controls', async () => {
    const user = userEvent.setup();
    const { container } = render(<StudioPage />);

    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText('dashboard')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mixer' }));
    expect(within(header as HTMLElement).getByText('mixer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'AI Host' }));
    expect(within(header as HTMLElement).getByText('ai host')).toBeInTheDocument();
  });

  it('toggles on-air state and keeps status token classes stable', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    const onAirToggle = screen.getByRole('button', { name: 'On-air broadcast toggle' });

    expect(onAirToggle).toHaveAttribute('aria-pressed', 'true');
    expect(onAirToggle).toHaveClass('bg-red-600/15', 'border-red-500/25', 'pulse-ring');
    expect(onAirToggle).toHaveTextContent('On Air');

    await user.click(onAirToggle);

    expect(onAirToggle).toHaveAttribute('aria-pressed', 'false');
    expect(onAirToggle).toHaveClass('bg-zinc-900/50', 'border-zinc-700/50');
    expect(onAirToggle).toHaveTextContent('Off Air');
  });
});
