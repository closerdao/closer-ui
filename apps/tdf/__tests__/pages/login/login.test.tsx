import Login from '@/pages/login';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Add this to ensure consistent timezone
process.env.TZ = 'UTC';

describe('Login', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should have both Email and wallet log in buttons if NEXT_PUBLIC_FEATURE_WEB3_WALLET is true', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    renderWithProviders(<Login />);

    const switcherEmailButton = screen.getByRole('button', { name: /email/i });
    const switcherWalletButton = screen.getByRole('button', {
      name: /wallet/i,
    });

    expect(switcherEmailButton).toBeDisabled();
    expect(switcherWalletButton).toBeEnabled();
  });

  it('should not render wallet login switcher button if NEXT_PUBLIC_FEATURE_WEB3_WALLET is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
    renderWithProviders(<Login />);

    const switcherWalletButton = screen.queryByRole('button', {
      name: /wallet/i,
    });
    expect(switcherWalletButton).not.toBeInTheDocument();
  });
});
