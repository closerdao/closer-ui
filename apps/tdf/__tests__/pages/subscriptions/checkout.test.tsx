import Checkout from '@/pages/subscriptions/checkout';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Subscriptions Summary', () => {
  it('should have a proper title', () => {
    renderWithProviders(<Checkout />);

    const title = screen.getByRole('heading', {
      name: /Checkout/i,
    });

    expect(title).toBeInTheDocument();
  });
});
