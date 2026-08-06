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
});
