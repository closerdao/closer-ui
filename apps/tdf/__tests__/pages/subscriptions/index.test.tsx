import SubscriptionsPage from '@/pages/legacy/subscriptions';
import { renderWithProviders } from '@/test/utils';

import { act, screen } from '@testing-library/react';

describe('Subscriptions', () => {
  it('should render comparison heading when multiple plans exist', async () => {
    renderWithProviders(<SubscriptionsPage />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const title = screen.getByRole('heading', {
      name: /Choose your membership/i,
    });

    expect(title).toBeInTheDocument();
    expect(screen.getByText(/Wanderer/i)).toBeInTheDocument();
    expect(screen.getByText(/Pioneer/i)).toBeInTheDocument();
  });

  it('should show create account CTA by default', async () => {
    renderWithProviders(<SubscriptionsPage />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const createAccountButtons = screen.getAllByRole('button', {
      name: /create account/i,
    });

    expect(createAccountButtons.length).toBeGreaterThan(0);
  });
});
