import Signup from '@/pages/signup';
import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

import { subscriptionsConfig } from '../../mocks/subscriptions';

describe('Signup', () => {
  it('should have proper heading', () => {
    renderWithAuth(<Signup subscriptionsConfig={subscriptionsConfig} />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(/sign up/i);
  });

  it('should have a Create account button disabled by default', () => {
    renderWithAuth(<Signup subscriptionsConfig={subscriptionsConfig} />);

    const button = screen.getByRole('button', { name: /sign up/i });

    expect(button).toBeDisabled();
  });
});
