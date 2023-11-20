import Signup from '@/pages/signup';

import { render, screen } from '@testing-library/react';
import { AuthProvider, ConfigProvider, blockchainConfig } from 'closer';

import config from '../../../config';
import { subscriptions } from '../../mocks/subscriptions';

describe('Signup', () => {
  it('should have proper heading', () => {
    render(
      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
        <AuthProvider>
          <Signup subscriptionPlans={subscriptions.plans} />
        </AuthProvider>
      </ConfigProvider>,
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
