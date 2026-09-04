import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import CreditsSubscriptionOffers from './index';

let cachedConfigs: Record<string, any> = {};
let mockUser: any = null;

jest.mock('../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: (slug: string) => cachedConfigs[slug] ?? null,
  getSavedConfig: (slug: string) => null,
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const plan = (overrides: Record<string, unknown> = {}) => ({
  slug: 'explorer',
  title: 'Explorer',
  description: 'For regular visitors',
  priceId: 'price_1',
  tier: 2,
  price: 30,
  billingPeriod: 'month',
  monthlyCredits: 2,
  available: true,
  tiersAvailable: false,
  perks: '',
  ...overrides,
});

describe('CreditsSubscriptionOffers', () => {
  beforeEach(() => {
    mockUser = null;
    cachedConfigs = {
      subscriptions: { enabled: true, elements: [plan()] },
      payment: { fiatCur: 'EUR' },
    };
  });

  it('lists a plan that grants monthly credits', () => {
    renderWithNextIntl(<CreditsSubscriptionOffers />);

    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByText('🥕 2 credits every month')).toBeInTheDocument();
  });

  it('leaves out plans that grant none', () => {
    cachedConfigs.subscriptions = {
      enabled: true,
      elements: [plan(), plan({ slug: 'basic', title: 'Basic', monthlyCredits: 0 })],
    };

    renderWithNextIntl(<CreditsSubscriptionOffers />);

    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.queryByText('Basic')).toBeNull();
  });

  it('renders nothing when no plan grants credits', () => {
    cachedConfigs.subscriptions = {
      enabled: true,
      elements: [plan({ monthlyCredits: 0 })],
    };

    const { container } = renderWithNextIntl(<CreditsSubscriptionOffers />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when subscriptions are switched off', () => {
    cachedConfigs.subscriptions = { enabled: false, elements: [plan()] };

    const { container } = renderWithNextIntl(<CreditsSubscriptionOffers />);

    expect(container).toBeEmptyDOMElement();
  });

  it('marks the member\'s own plan', () => {
    mockUser = { subscription: { priceId: 'price_1' } };

    renderWithNextIntl(<CreditsSubscriptionOffers />);

    expect(screen.getByText('Your plan')).toBeInTheDocument();
  });
});
