import Success from '@/pages/subscriptions/success';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Subscriptions success', () => {
  it('should have a proper title and "View subscription" button enabled', () => {
    renderWithProviders(<Success />);

    const title = screen.getByRole('heading', {
      name: /Success/i,
    });

    const button = screen.getByRole('button', { name: /View subscription/i });
    expect(title).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});
