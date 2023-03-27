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

  it('should have both "Log in" buttons enabled if NEXT_PUBLIC_FEATURE_WEB3_WALLET is true', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    renderWithProviders(<Login />);
    const buttonSignIn = screen.getByRole('button', { name: /^Sign in$/ });
    const buttonSignInWithWallet = screen.getByRole('button', {
      name: /sign in with wallet/i,
    });
    expect(buttonSignIn).toBeEnabled();
    expect(buttonSignInWithWallet).toBeInTheDocument();
  });

  it('should not render "Log in with wallet" button if NEXT_PUBLIC_FEATURE_WEB3_WALLET is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
    renderWithProviders(<Login />);

    const buttonSignInWithWallet = screen.queryByRole('button', {
      name: /sign in with wallet/i,
    });
    expect(buttonSignInWithWallet).not.toBeInTheDocument();
  });
});
