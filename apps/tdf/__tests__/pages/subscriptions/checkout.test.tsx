import Checkout from '@/pages/subscriptions/checkout';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Subscriptions Summary', () => {
  it('should have a proper title and "Pay" button disabled by default', () => {
    renderWithProviders(<Checkout />);

    const title = screen.getByRole('heading', {
      name: /Checkout/i,
    });

    const payButton = screen.getByRole('button', { name: /pay/i });
    expect(title).toBeInTheDocument();
    expect(payButton).toBeDisabled();
  });
});
