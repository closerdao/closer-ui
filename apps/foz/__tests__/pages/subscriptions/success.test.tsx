import Success from '@/pages/subscriptions/success';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import { subscriptions } from '../../mocks/subscriptions';

describe.skip('Subscriptions success', () => {
  it('should have a proper title and "View subscription" button enabled', () => {
    renderWithProviders(<Success subscriptionPlans={subscriptions.plans} />);

    const title = screen.getByRole('heading', {
      name: /Success/i,
    });

    const button = screen.getByRole('button', { name: /View subscription/i });
    expect(title).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});