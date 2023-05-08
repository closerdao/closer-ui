import Subscriptions from '@/pages/subscriptions';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { subscriptions } from '../../mocks/subscriptions';

describe('Subscriptions', () => {
  it('should have a proper title', () => {
    renderWithProviders(
      <Subscriptions subscriptionPlans={subscriptions.plans} />,
    );

    const title = screen.getByRole('heading', {
      name: /Subscriptions/i,
    });

    expect(title).toBeInTheDocument();
  });

  it('should show free plan card by default', () => {
    renderWithProviders(<Subscriptions subscriptionPlans={subscriptions.plans} />);

    const createAccountButton = screen.getByRole('button', {
      name: /create account/i,
    });

    expect(createAccountButton).toBeInTheDocument();
  });
});
