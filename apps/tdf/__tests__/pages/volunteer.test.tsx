import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import VolunteerPage from '../../pages/volunteer';
import { volunteerEventMock } from '../mocks/volunteerEvent';

describe('Volunteer', () => {
  it('should render and have proper title', () => {
    const eventListMock = [volunteerEventMock];
    renderWithProviders(<VolunteerPage opportunities={eventListMock} />);
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/Volunteering Opportunities/i);
  });
});
