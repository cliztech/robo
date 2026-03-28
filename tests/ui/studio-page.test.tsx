import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioPage from '@/app/page';

describe('StudioPage', () => {
  it('switches views from sidebar controls', async () => {
    const user = userEvent.setup();
    const { container } = render(<StudioPage />);

    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText('Dashboard')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mixer' }));
    expect(within(header as HTMLElement).getByText('Mixer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'AI Host' }));
    expect(within(header as HTMLElement).getByText('AI Host')).toBeInTheDocument();
  });


  it('renders the radio station control room in studio view', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await user.click(screen.getByRole('button', { name: 'Studio' }));

    expect(screen.getByRole('region', { name: 'Radio station control room' })).toBeInTheDocument();
    expect(screen.getByText('Run the full station from one cinematic broadcast surface.')).toBeInTheDocument();
    expect(screen.getByText('Smart playlist stack')).toBeInTheDocument();
    expect(screen.getByText('Host tools & live assist')).toBeInTheDocument();
    expect(screen.getByText('Outputs, compliance, and audience')).toBeInTheDocument();
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
