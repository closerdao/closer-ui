import React from 'react';

import { screen } from '@testing-library/react';

import FinancedTokenMenuWidget from '../components/FinancedTokenMenuWidget';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

const makeApplication = (id: string) => ({
  _id: id,
  status: 'pending-payment',
  tokensAccrued: 12,
});

const mockApplications = (applications: unknown[]) => {
  const financeapplication = {
    get: jest
      .fn()
      .mockResolvedValue({ results: { toJS: () => applications } }),
  };
  (usePlatform as jest.Mock).mockReturnValue({
    platform: { financeapplication },
  });
  return financeapplication;
};

describe('FinancedTokenMenuWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP = 'true';
    (useAuth as jest.Mock).mockReturnValue({ user: { _id: 'user-1' } });
  });

  it('shows the contract details when a single contract is open', async () => {
    mockApplications([makeApplication('finance-1')]);

    renderWithNextIntl(<FinancedTokenMenuWidget />);

    expect(await screen.findByText('Deposit due')).toBeInTheDocument();
    expect(screen.getByText('Tokens accrued')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View details/i })).toHaveAttribute(
      'href',
      '/token/financed/finance-1',
    );
  });

  it('links to the list and counts contracts when several are open', async () => {
    mockApplications([
      makeApplication('finance-1'),
      makeApplication('finance-2'),
      makeApplication('finance-3'),
    ]);

    renderWithNextIntl(<FinancedTokenMenuWidget />);

    // The per-contract status and accrual are meaningless across contracts.
    expect(await screen.findByText('Open contracts')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Deposit due')).not.toBeInTheDocument();
    expect(screen.queryByText('Tokens accrued')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /View contracts/i }),
    ).toHaveAttribute('href', '/token/financed');
  });
});
