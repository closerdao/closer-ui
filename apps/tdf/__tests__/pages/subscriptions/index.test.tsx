import Subscriptions from '@/pages/subscriptions';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Subscriptions', () => {
  it('should render and have a proper title', () => {
    renderWithProviders(<Subscriptions />);

    const title = screen.getByRole('heading', {
      name: /Subscriptions/i,
    });

    expect(title).toBeInTheDocument();
  });

  it('should show free plan card by default', () => {
    renderWithProviders(<Subscriptions />);

    const createAccountButton = screen.getByRole('button', { name: /create account/i });
    expect(createAccountButton).toBeInTheDocument();
  });
});
