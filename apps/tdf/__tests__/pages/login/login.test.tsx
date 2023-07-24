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

  it('should have both Email and wallet log in buttons if NEXT_PUBLIC_FEATURE_WEB3_WALLET is true', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    renderWithProviders(<Login />);

    const switcherEmailButton = screen.getByRole('button', { name: /email/i });
    const switcherWalletButton = screen.getByRole('button', { name: /wallet/i });

      
    expect(switcherEmailButton).toBeDisabled();
    expect(switcherWalletButton).toBeEnabled();
  });

  it('should not render wallet login switcher button if NEXT_PUBLIC_FEATURE_WEB3_WALLET is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
    renderWithProviders(<Login />);

    const switcherWalletButton = screen.queryByRole('button', { name: /wallet/i });
    expect(switcherWalletButton).not.toBeInTheDocument();
  });
});
