import Signup from '@/pages/signup';

import { render, screen } from '@testing-library/react';
import { AuthProvider } from 'closer';

import { subscriptions } from '../../mocks/subscriptions';

describe.skip('Signup', () => {
  it('should have proper heading', () => {
    render(
      <AuthProvider>
        <Signup subscriptionPlans={subscriptions.plans} />
      </AuthProvider>,
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(/sign up/i);
  });

  it('should have a Create account button disabled by default', () => {
    render(
      <AuthProvider>
        <Signup subscriptionPlans={subscriptions.plans} />
      </AuthProvider>,
    );
    const button = screen.getByRole('button', { name: /sign up/i });

    expect(button).toBeDisabled();
  });

});
