import { render, screen } from '@testing-library/react';

import SubscriptionCards from '.';
import config from './mocks';

describe('SubscriptionCards', () => {
  const handleNext = jest.fn();
  const subscriptions = config.SUBSCRIPTIONS;
  const paidSubscriptionPlans = subscriptions.plans.filter(
    (plan) => plan.price !== 0,
  );
  it('should show cards for all subscription plans if user is not athenticated', () => {
    const isAuthenticated = false;

    render(
      <SubscriptionCards
        // config={subscriptions.config}
        currency="EUR"
        filteredSubscriptionPlans={
          isAuthenticated ? paidSubscriptionPlans : subscriptions.plans
        }
        clickHandler={handleNext}
      />,
    );

    const cardTitles = screen.getAllByRole('heading', { level: 2 });
    expect(cardTitles).toHaveLength(3);
  });

  it('should filter out free plan if user is athenticated', () => {
    const isAuthenticated = true;

    render(
      <SubscriptionCards
        currency="EUR"
        filteredSubscriptionPlans={
          isAuthenticated ? paidSubscriptionPlans : subscriptions.plans
        }
        clickHandler={handleNext}
      />,
    );

    const cardTitles = screen.getAllByRole('heading', { level: 2 });
    expect(cardTitles).toHaveLength(2);

    const freePlanTitle = screen.queryByRole('heading', { name: /explorer/i });
    expect(freePlanTitle).not.toBeInTheDocument();
  });
});
