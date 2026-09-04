import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import AffiliatePage from '../pages/settings/affiliate';
import { renderWithNextIntl } from './utils';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/settings/affiliate',
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

jest.mock('../utils/metrics', () => ({
  logMetric: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/village.utils', () => ({
  fetchUserVillageConnections: jest.fn(() => Promise.resolve([])),
  isVillageDeployed: (village: { onboardingStatus?: string }) =>
    village.onboardingStatus === 'live',
}));

// A community with its own per-type rates. The hub ignores every one of them.
const mockAffiliateConfig = {
  enabled: true,
  staysCommissionPercent: 10,
  eventsCommissionPercent: 10,
  subscriptionCommissionPercent: 30,
  productsCommissionPercent: 10,
  tokenSaleCommissionPercent: 3,
  financedTokenSaleCommissionPercent: 3,
  promoMaterialsUrl: '',
};

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn((slug: string) =>
    slug === 'affiliate'
      ? mockAffiliateConfig
      : { teamEmail: 'team@example.com' },
  ),
}));

const charges = [
  {
    _id: 'charge-subscription',
    type: 'subscription',
    amount: { total: { val: 49, cur: 'EUR' } },
    affiliateRevenue: { val: 14.7, cur: 'EUR' },
  },
  {
    _id: 'charge-stay',
    type: 'booking',
    amount: { total: { val: 100, cur: 'EUR' } },
    affiliateRevenue: { val: 10, cur: 'EUR' },
  },
  // A village's reported platform fees, as the hub books them (POST /federation/income).
  {
    _id: 'charge-village-fees',
    type: 'villagePlatformFee',
    amount: { total: { val: 60, cur: 'EUR' } },
    affiliateRevenue: { val: 3, cur: 'EUR' },
  },
];

const makePlatform = () => ({
  user: {
    get: jest.fn().mockResolvedValue({}),
    getCount: jest.fn().mockResolvedValue({}),
    find: jest.fn(() => ({ toJS: () => [] })),
    findCount: jest.fn(() => 2),
  },
  charge: {
    get: jest.fn().mockResolvedValue({}),
    find: jest.fn((filter: { where?: { type?: string } }) => ({
      toJS: () => (filter?.where?.type === 'affiliatePayout' ? [] : charges),
    })),
  },
  metric: {
    getCount: jest.fn().mockResolvedValue({}),
    findCount: jest.fn(() => 7),
  },
});

describe('AffiliatePage (settings)', () => {
  const affiliateFlag = process.env.NEXT_PUBLIC_FEATURE_AFFILIATE;
  const federationFlag = process.env.NEXT_PUBLIC_FEATURE_FEDERATION;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE = 'true';
    delete process.env.NEXT_PUBLIC_FEATURE_FEDERATION;
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'user-1', affiliate: '2026-01-01T00:00:00.000Z' },
    });
    (usePlatform as jest.Mock).mockReturnValue({ platform: makePlatform() });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE = affiliateFlag;
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = federationFlag;
  });

  it('shows the per-type commission rates on a community', async () => {
    renderWithNextIntl(<AffiliatePage />);

    expect(await screen.findByText('30% commission')).toBeInTheDocument();
    expect(screen.getAllByText('10% commission').length).toBeGreaterThan(0);
    expect(screen.queryByText(/of Closer.s revenue/)).not.toBeInTheDocument();
    expect(screen.getByText('Token sales')).toBeInTheDocument();
    expect(screen.queryByText('Villages maintained')).not.toBeInTheDocument();
    // Village fee income only exists on the hub, so a community never lists it.
    expect(screen.queryByText('Village platform fees')).not.toBeInTheDocument();
  });

  it('shows the flat ambassador share on a federation hub', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    renderWithNextIntl(<AffiliatePage />);

    // One line per revenue type that earned something: village fees,
    // subscription and stay - the village fees first.
    expect(await screen.findAllByText('5% of Closer’s revenue')).toHaveLength(
      3,
    );
    expect(screen.getByText('Village platform fees')).toBeInTheDocument();
    expect(screen.getByText('€3.00')).toBeInTheDocument();
    expect(screen.queryByText('30% commission')).not.toBeInTheDocument();
    expect(screen.queryByText('10% commission')).not.toBeInTheDocument();
    expect(screen.getByText('Villages maintained')).toBeInTheDocument();
    expect(screen.queryByText('Token sales')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /About the Ambassador program/ }),
    ).toHaveAttribute('href', '/ambassadors');
  });

  it('builds referral links for the platform it runs on', async () => {
    renderWithNextIntl(<AffiliatePage />);

    const input = await screen.findByLabelText(/Paste any page from/);
    await userEvent.type(input, 'http://localhost/stay');
    await userEvent.click(screen.getByRole('button', { name: /Generate link/ }));

    expect(screen.getByTestId('affiliate-tracking-link')).toHaveTextContent(
      'http://localhost/stay?referral=user-1',
    );

    await userEvent.clear(input);
    await userEvent.type(input, 'https://traditionaldreamfactory.com/stay');
    await userEvent.click(screen.getByRole('button', { name: /Generate link/ }));

    await waitFor(() =>
      expect(
        screen.getByText('Please enter a page on localhost'),
      ).toBeInTheDocument(),
    );
  });
});
