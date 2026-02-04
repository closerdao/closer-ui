import DateSelector from '@/pages/bookings/create/dates';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';

describe('DateSelector', () => {
  it('should render and have a proper title', () => {
    renderWithProviders(
      <DateSelector
        bookingSettings={bookingConfig}
        volunteerConfig={null}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /your stay/i,
    });
    expect(title).toBeInTheDocument();
  });
});
