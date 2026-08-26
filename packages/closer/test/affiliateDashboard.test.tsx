import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import AffiliateDashboardPage from '../pages/dashboard/affiliate';
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

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(() => ({ enabled: true })),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../../utils/api" the page imports.
// Mocking the real file path gives us the instance it actually calls.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const applicants = [
  {
    _id: 'user-pending',
    screenname: 'Ada Lovelace',
    email: 'ada@example.com',
    slug: 'ada',
    roles: ['member'],
    affiliateApplication: {
      reason: 'I run a regenerative travel newsletter',
      audienceSize: '12000 readers',
      status: 'pending',
      appliedAt: '2026-08-01T10:00:00.000Z',
    },
  },
];

const affiliateData = [
  {
    _id: 'affiliate-row-1',
    totalRevenue: 500,
    user: {
      _id: 'user-affiliate',
      screenname: 'Grace Hopper',
      email: 'grace@example.com',
      slug: 'grace',
    },
    data: [
      {
        _id: 'charge-1',
        type: 'subscription',
        amount: { total: { val: 100 } },
        affiliateRevenue: { val: 10 },
        created: '2026-07-01T10:00:00.000Z',
      },
    ],
  },
];

const makePlatform = () => ({
  user: {
    get: jest.fn().mockResolvedValue({ results: { toJS: () => applicants } }),
    getCount: jest.fn().mockResolvedValue({ results: 1 }),
    findCount: jest.fn(() => 1),
    patch: jest.fn().mockResolvedValue({}),
  },
  metric: {
    getCount: jest.fn().mockResolvedValue({ results: 0 }),
    findCount: jest.fn(() => 0),
  },
});

describe('AffiliateDashboardPage', () => {
  let platform: ReturnType<typeof makePlatform>;
  const federationFlag = process.env.NEXT_PUBLIC_FEATURE_FEDERATION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = federationFlag;
  });

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_FEATURE_FEDERATION;
    jest.clearAllMocks();
    platform = makePlatform();
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'admin-1', roles: ['admin'] },
    });
    (usePlatform as jest.Mock).mockReturnValue({ platform });
    api.get.mockResolvedValue({
      data: { results: { affiliateData, payoutData: [] } },
    });
    api.post.mockResolvedValue({ data: {} });
  });

  it('lists pending applications above the affiliate table', async () => {
    renderWithNextIntl(<AffiliateDashboardPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(
      screen.getByText('I run a regenerative travel newsletter'),
    ).toBeInTheDocument();
    // Extra application fields are rendered without needing a translation each.
    expect(screen.getByText('Audience size:')).toBeInTheDocument();

    expect(platform.user.get).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { 'affiliateApplication.status': 'pending' },
      }),
      { force: true },
    );
  });

  it('approves an applicant through the affiliates endpoint', async () => {
    renderWithNextIntl(<AffiliateDashboardPage />);

    const approve = await screen.findByRole('button', { name: /approve/i });
    await userEvent.click(approve);

    expect(api.post).toHaveBeenCalledWith('/affiliates/approve', {
      userId: 'user-pending',
    });
    expect(platform.user.patch).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument(),
    );
  });

  it('grants the ambassador role on approval when federation is enabled', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    renderWithNextIntl(<AffiliateDashboardPage />);

    const approve = await screen.findByRole('button', { name: /approve/i });
    await userEvent.click(approve);

    await waitFor(() =>
      expect(platform.user.patch).toHaveBeenCalledWith('user-pending', {
        roles: ['member', 'ambassador'],
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument(),
    );
  });

  it('reveals the row actions only once the details dropdown is open', async () => {
    renderWithNextIntl(<AffiliateDashboardPage />);

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /remove affiliate/i }),
    ).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /details/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    expect(screen.getByText('View profile')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove affiliate/i }),
    ).toBeInTheDocument();
  });

  it('removes an affiliate after the confirmation is accepted', async () => {
    renderWithNextIntl(<AffiliateDashboardPage />);

    await userEvent.click(await screen.findByRole('button', { name: /details/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /remove affiliate/i }),
    );

    expect(
      screen.getByText(/Remove Grace Hopper from the affiliate program\?/),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalledWith(
      '/affiliates/remove',
      expect.anything(),
    );

    const confirm = screen
      .getAllByRole('button', { name: /remove affiliate/i })
      .at(-1) as HTMLElement;
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/affiliates/remove', {
        userId: 'user-affiliate',
      }),
    );
  });
});
