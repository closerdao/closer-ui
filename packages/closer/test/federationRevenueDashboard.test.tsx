import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';

import { useAuth } from '../contexts/auth';
import RevenuePage from '../pages/dashboard/revenue';
import { renderWithNextIntl } from './utils';

jest.mock('../components/Dashboard/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(() => ({ enabled: true })),
}));

jest.mock('../hooks/useRBAC', () => ({
  __esModule: true,
  default: () => ({ hasAccess: () => true }),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../../utils/api" the page imports.
// Mocking the real file path gives us the instance it actually calls.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { results: [] } })) },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
}));

const api = jest.requireMock('../utils/api.js').default as { get: jest.Mock };

const platformFeeCharges = [
  {
    _id: 'fee-tdf-1',
    type: 'villagePlatformFee',
    status: 'paid',
    method: 'billing',
    date: '2026-03-04T00:00:00.000Z',
    amount: { total: { val: 120, cur: 'EUR' } },
    linkedObjectType: 'Village',
    linkedObjectId: 'village-tdf',
    description:
      'Platform fees · Traditional Dream Factory · 2026-03-03 – 2026-03-04',
    meta: { chargeCount: 9, refundCount: 1, villageId: 'village-tdf' },
  },
  {
    _id: 'fee-amagi-1',
    type: 'villagePlatformFee',
    status: 'paid',
    method: 'billing',
    date: '2026-03-04T00:00:00.000Z',
    amount: { total: { val: 30, cur: 'EUR' } },
    linkedObjectType: 'Village',
    linkedObjectId: 'village-amagi',
    description: 'Platform fees · Amagi · 2026-03-03 – 2026-03-04',
    meta: { chargeCount: 3, refundCount: 0, villageId: 'village-amagi' },
  },
];

const subscriptionCharges = [
  {
    _id: 'sub-1',
    type: 'subscription',
    status: 'paid',
    method: 'stripe',
    date: '2026-03-01T00:00:00.000Z',
    amount: { total: { val: 49, cur: 'EUR' } },
    createdBy: 'founder-tdf',
  },
];

const villages = [
  {
    _id: 'village-tdf',
    name: 'Traditional Dream Factory',
    createdBy: 'founder-tdf',
    onboardingStatus: 'live',
  },
  { _id: 'village-amagi', name: 'Amagi', onboardingStatus: 'live' },
];

/** Answers each endpoint the hub view calls, by path and `where.type`. */
const routeApi = () => {
  api.get.mockImplementation((path: string, config?: any) => {
    const where = config?.params?.where || {};
    if (path === '/charge') {
      return Promise.resolve({
        data: {
          results:
            where.type === 'villagePlatformFee'
              ? platformFeeCharges
              : subscriptionCharges,
        },
      });
    }
    if (path === '/village') {
      return Promise.resolve({ data: { results: villages } });
    }
    if (path === '/sum/charge/amount.total.val') {
      return Promise.resolve({
        data: { results: where.type === 'villagePlatformFee' ? 150 : 49 },
      });
    }
    if (path === '/count/charge') {
      return Promise.resolve({ data: { results: 3 } });
    }
    return Promise.resolve({ data: { results: [] } });
  });
};

const callsTo = (path: string) =>
  api.get.mock.calls.filter((call) => call[0] === path);

describe('RevenuePage on a federation hub', () => {
  const federationFlag = process.env.NEXT_PUBLIC_FEATURE_FEDERATION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = federationFlag;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'admin-1', roles: ['admin'] },
    });
    routeApi();
  });

  it('reads platform fees off /charge by type, not the operator ledger', async () => {
    renderWithNextIntl(<RevenuePage />);

    await waitFor(() => expect(callsTo('/charge').length).toBeGreaterThan(0));

    const types = callsTo('/charge').map(
      (call) => call[1]?.params?.where?.type,
    );
    expect(types).toEqual(
      expect.arrayContaining(['villagePlatformFee', 'subscription']),
    );
    expect(callsTo('/income-tracking/combined-entries')).toHaveLength(0);
  });

  it('shows subscriptions and platform fee as the only two categories', async () => {
    renderWithNextIntl(<RevenuePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Subscriptions').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Platform Fee').length).toBeGreaterThan(0);

    // The operator breakdown is gone: no hospitality, no token sales.
    expect(screen.queryByText('Hospitality')).not.toBeInTheDocument();
    expect(screen.queryByText('Fiat Token Sales')).not.toBeInTheDocument();
    expect(screen.queryByText('Crypto Token Sales')).not.toBeInTheDocument();
  });

  it('breaks earnings down per village, biggest first', async () => {
    renderWithNextIntl(<RevenuePage />);

    const tdf = await screen.findByText('Traditional Dream Factory');
    const amagi = await screen.findByText('Amagi');

    const row = tdf.closest('tr') as HTMLElement;
    // 120 in platform fees plus the 49 subscription its founder pays.
    expect(within(row).getByText('€169.00')).toBeInTheDocument();
    expect(within(row).getByText('€120.00')).toBeInTheDocument();
    expect(within(row).getByText('€49.00')).toBeInTheDocument();

    const names = screen
      .getAllByRole('row')
      .map((tableRow) => tableRow.textContent || '');
    expect(names.findIndex((text) => text.includes('Traditional'))).toBeLessThan(
      names.findIndex((text) => text.includes('Amagi')),
    );
    expect(amagi).toBeInTheDocument();
  });

  it('looks villages up only for the ones that earned something', async () => {
    renderWithNextIntl(<RevenuePage />);

    await waitFor(() => expect(callsTo('/village').length).toBeGreaterThan(0));

    const where = callsTo('/village')[0][1]?.params?.where;
    expect(where.$or[0]._id.$in).toEqual([
      'village-tdf',
      'village-amagi',
    ]);
    expect(where.$or[1].createdBy.$in).toEqual(['founder-tdf']);
  });

  it('keeps the operator view when federation is off', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'false';
    renderWithNextIntl(<RevenuePage />);

    await waitFor(() => {
      expect(screen.getByText('Hospitality')).toBeInTheDocument();
    });
    expect(
      callsTo('/charge').filter(
        (call) => call[1]?.params?.where?.type === 'villagePlatformFee',
      ),
    ).toHaveLength(0);
  });
});
