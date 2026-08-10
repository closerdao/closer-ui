import Login from '@/pages/login';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Login', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should not render Sign in with Wallet button when NEXT_PUBLIC_FEATURE_WEB3_WALLET is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
    renderWithProviders(<Login />);

    const walletButton = screen.queryByRole('button', {
      name: /sign in with wallet/i,
    });
    expect(walletButton).not.toBeInTheDocument();
  });
});
