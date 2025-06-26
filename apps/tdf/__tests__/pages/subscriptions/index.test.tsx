import { generalConfig } from '@/__tests__/mocks/generalConfig';
import SubscriptionsPage from '@/pages/subscriptions';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { listings } from '../../mocks/listings';
import { subscriptionsConfig } from '../../mocks/subscriptions';

describe('Subscriptions', () => {
  it('should have a proper title', () => {
    renderWithProviders(
      <SubscriptionsPage
        listings={listings}
        subscriptionsConfig={subscriptionsConfig}
        generalConfig={generalConfig}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /SUBSCRIBE TO THE PLACE YOUR HEART CALLS HOME/i,
    });

    expect(title).toBeInTheDocument();
  });

  it('should show free plan card by default', () => {
    renderWithProviders(
      <SubscriptionsPage
        listings={listings}
        subscriptionsConfig={subscriptionsConfig}
        generalConfig={generalConfig}
      />,
    );

    const createAccountButton = screen.getByRole('button', {
      name: /create account/i,
    });

    expect(createAccountButton).toBeInTheDocument();
  });
});
