import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import VolunteerPage from '../../pages/volunteer';
import { volunteerEventMock } from '../mocks/volunteerEvent';

describe('Volunteer', () => {
  
  beforeEach(() => {
    // Mock environment variable
    process.env = Object.assign(process.env, { NEXT_PUBLIC_FEATURE_VOLUNTEERING: 'true' });
  });
  it('should render and have proper title', () => {
    const volunteerConfigMock = { enabled: true };

    const eventListMock = [volunteerEventMock];
    renderWithProviders(<VolunteerPage volunteerConfig={volunteerConfigMock} opportunities={eventListMock} />);
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/Volunteers Open Call/i);
  });
});
