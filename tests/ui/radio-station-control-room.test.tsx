import { render, screen } from '@testing-library/react';
import { RadioStationControlRoom } from '@/components/console/RadioStationControlRoom';

describe('RadioStationControlRoom', () => {
  it('renders the core station operations surfaces', () => {
    render(<RadioStationControlRoom />);

    expect(screen.getByRole('region', { name: 'Radio station control room' })).toBeInTheDocument();
    expect(screen.getByText('Run the full station from one cinematic broadcast surface.')).toBeInTheDocument();
    expect(screen.getByText('Clock & scheduling')).toBeInTheDocument();
    expect(screen.getByText('Smart playlist stack')).toBeInTheDocument();
    expect(screen.getByText('Host tools & live assist')).toBeInTheDocument();
    expect(screen.getByText('Outputs, compliance, and audience')).toBeInTheDocument();
    expect(screen.getAllByText('Neon Skyline').length).toBeGreaterThan(0);
    expect(screen.getByText('Voice break composer')).toBeInTheDocument();
  });
});
