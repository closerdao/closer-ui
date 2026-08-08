import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import VolunteerPage from '../../pages/volunteer';

describe('Volunteer', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env = Object.assign(process.env, {
      NEXT_PUBLIC_FEATURE_VOLUNTEERING: 'true',
    });
  });

  it('should render and have proper title', () => {
    renderWithProviders(<VolunteerPage />);
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/Seasonal Volunteers, Open Call/i);
  });

  it('should point both apply buttons at the application form', () => {
    renderWithProviders(<VolunteerPage />);
    const applyLinks = screen.getAllByRole('link', { name: /apply/i });

    expect(applyLinks).toHaveLength(2);
    applyLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/volunteer/apply');
    });
  });

  it('should interpolate min stay and daily rates from config', () => {
    renderWithProviders(<VolunteerPage />);

    expect(
      screen.getByRole('heading', { name: /Minimum stay of 28 days/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('12 euros per day, food')).toBeInTheDocument();
    expect(screen.getByText('2 euros per day, utilities')).toBeInTheDocument();
    expect(
      screen.getByText('14 euros per day total, VAT included'),
    ).toBeInTheDocument();
  });
});
