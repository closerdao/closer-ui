import { render, screen } from '@testing-library/react';

import SubscriptionCards from '.';
import config from './mocks';

// TODO: set up renderWithProviders to test components that require context

describe('SubscriptionCards', () => {
  const handleNext = jest.fn();
  const subscriptions = config.SUBSCRIPTIONS;

  it.skip('should show cards for all subscription plans if user is not authenticated', () => {
    render(
      <SubscriptionCards
        currency="EUR"
        plans={subscriptions.plans}
        clickHandler={handleNext}
      />,
    );

    const cardTitles = screen.getAllByRole('heading', { level: 2 });
    expect(cardTitles).toHaveLength(3);
  });

  it.skip('should filter out free plan if user is authenticated', () => {
    render(
      <SubscriptionCards
        currency="EUR"
        plans={subscriptions.plans}
        clickHandler={handleNext}
      />,
    );

    const cardTitles = screen.getAllByRole('heading', { level: 2 });
    expect(cardTitles).toHaveLength(2);

    const freePlanTitle = screen.queryByRole('heading', { name: /explorer/i });
    expect(freePlanTitle).not.toBeInTheDocument();
  });
});
