import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import Subscriptions from '../../../pages/settings/subscriptions';

describe('Subscription settings', () => {
  it('should have a proper title', () => {
    renderWithProviders(<Subscriptions />);
    
    const title = screen.getByRole('heading', {
      name: /Your subscription/i,
    });

    expect(title).toBeInTheDocument();
  });
});
