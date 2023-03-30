import DateSelector from '@/pages/bookings/create/dates';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('DateSelector', () => {
  it('should render and have a proper title and search button enabled', () => {
    renderWithProviders(<DateSelector />);

    const title = screen.getByRole('heading', {
      name: /your stay/i,
    });
    const button = screen.getByRole('button', { name: /search/i });
    expect(title).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});
