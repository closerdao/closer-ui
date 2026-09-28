import { useRouter } from 'next/router';

import React from 'react';

import { render, screen } from '@testing-library/react';

import SaleSummaryPage from '../pages/sale/[saleId]';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    user: { walletAddress: '0xbuyer' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));
jest.mock('../hooks/useConfig', () => ({
  useConfig: () => ({ platformName: 'Test' }),
}));
jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: () => null,
}));
jest.mock('../utils/metrics', () => ({
  linkedMetricFields: jest.fn(),
  logMetric: jest.fn(),
}));
jest.mock('nextjs-google-analytics', () => ({ event: jest.fn() }));
jest.mock('../utils/posthog', () => ({
  AnalyticsEvents: { TOKEN_PURCHASED: 'token_purchased' },
  trackEvent: jest.fn(),
}));
jest.mock('../components/Wallet', () => () => null);
jest.mock('../components/ConfirmationCelebrationOverlay', () => ({
  __esModule: true,
  default: ({ show, title }: { show: boolean; title: string }) =>
    show ? <div data-testid="celebration">{title}</div> : null,
  CONFIRMATION_CELEBRATION_DURATION_MS: 3000,
}));
jest.mock('next-intl', () => {
  const translate = Object.assign((key: string) => key, {
    rich: (key: string) => key,
  });
  return { useTranslations: () => translate };
});
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  formatSearch: JSON.stringify,
}));
const api = jest.requireMock('../utils/api.js').default;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'true';
  (useRouter as jest.Mock).mockReturnValue({
    query: { saleId: 'sale-1' },
    isReady: true,
    asPath: '/sale/sale-1',
    push: jest.fn(),
  });
});

it.each(['token', 'tokens'])(
  'shows purchase success for a completed crypto %s sale',
  async (product_type) => {
    api.get.mockResolvedValue({
      data: {
        results: [
          {
            _id: 'sale-1',
            product_type,
            status: 'completed',
            paymentMethod: 'crypto',
            quantity: 3,
            total_price: 803.92,
            currency: 'EUR',
            tx_hash: `0x${'a'.repeat(64)}`,
          },
        ],
      },
    });
    render(<SaleSummaryPage />);
    expect(
      await screen.findByText('sale_summary_festive_lead'),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('celebration')).toHaveTextContent(
      'sale_summary_success_heading',
    );
    expect(
      screen.queryByText('sale_summary_pending_payment_lead'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('sale_summary_bank_transfer_compact_intro'),
    ).not.toBeInTheDocument();
  },
);

it('keeps the payment reminder for a pending bank transfer', async () => {
  api.get.mockResolvedValue({
    data: {
      results: [
        {
          _id: 'sale-2',
          product_type: 'token',
          status: 'pending-payment',
          paymentMethod: 'bank',
          memoCode: 'REFERENCE',
          quantity: 3,
          total_price: 803.92,
          currency: 'EUR',
        },
      ],
    },
  });
  render(<SaleSummaryPage />);
  expect(
    await screen.findByText('sale_summary_bank_transfer_compact_intro'),
  ).toBeInTheDocument();
  expect(await screen.findByTestId('celebration')).toHaveTextContent(
    'token_sale_bank_transfer_success_bank_transfer',
  );
  expect(
    screen.queryByText('sale_summary_festive_lead'),
  ).not.toBeInTheDocument();
});
