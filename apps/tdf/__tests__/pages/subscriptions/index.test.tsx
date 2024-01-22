import SubscriptionsPage from '@/pages/subscriptions';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { listings } from '../../mocks/listings';
import { subscriptions } from '../../mocks/subscriptions';

describe('Subscriptions', () => {
  it('should have a proper title', () => {
    renderWithProviders(
      <SubscriptionsPage
        listings={listings}
        subscriptionPlans={subscriptions}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /ONE REGENERATIVE CO-LIVING/i,
    });

    expect(title).toBeInTheDocument();
  });

  it('should show free plan card by default', () => {
    renderWithProviders(
      <SubscriptionsPage
        listings={listings}
        subscriptionPlans={subscriptions}
      />,
    );

    const createAccountButton = screen.getByRole('button', {
      name: /create account/i,
    });

    expect(createAccountButton).toBeInTheDocument();
  });
});
