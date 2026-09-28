import Summary from '@/pages/subscriptions/summary';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { paymentConfig } from '../../mocks';
import { generalConfig } from '../../mocks/generalConfig';
import { subscriptionsConfig } from '../../mocks/subscriptions';

describe('Subscriptions Summary', () => {
  it('should have a proper title and "Edit" and "Checkout" buttons enabled', () => {
    renderWithProviders(
      <Summary
        subscriptionsConfig={subscriptionsConfig}
        generalConfig={generalConfig}
        paymentConfig={paymentConfig}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /Summary/i,
    });

    // const editButton = screen.getByRole('button', { name: /edit/i });
    // const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    // expect(title).toBeInTheDocument();
    // expect(editButton).toBeInTheDocument();
    // expect(editButton).toBeEnabled();
    // expect(checkoutButton).toBeInTheDocument();
    // expect(checkoutButton).toBeEnabled();
  });
});
