import Checkout from '@/pages/subscriptions/checkout';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { subscriptions } from '../../mocks/subscriptions';

describe.skip('Subscriptions Summary', () => {
  it('should have a proper title and "Pay" button disabled by default', () => {
    renderWithProviders(<Checkout subscriptionPlans={subscriptions} />);

    const title = screen.getByRole('heading', {
      name: /Checkout/i,
    });

    const payButton = screen.getByRole('button', { name: /pay/i });
    expect(title).toBeInTheDocument();
    expect(payButton).toBeDisabled();
  });
});
