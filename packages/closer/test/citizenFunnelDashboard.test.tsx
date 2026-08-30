import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';

import { useRouter } from 'next/router';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import useRBAC from '../hooks/useRBAC';
import CitizensFunnelPage from '../pages/dashboard/citizens/[tab]';
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

jest.mock('../hooks/useRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  cdn: '',
}));

jest.mock('../hooks/useConfig', () => ({
  useConfig: jest.fn(() => ({
    platformName: 'Test Land',
    citizenship: { enabled: true },
  })),
}));

/**
 * The real `getCachedConfig` rebuilds and returns a fresh object on every call.
 * Mirroring that here is the point of these tests: reading it straight into
 * render used to give `load()` a new identity every pass, so its effect
 * re-fired forever.
 */
jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn((slug: string) =>
    slug === 'citizenship'
      ? { enabled: true, tokensRequired: 30, minVouchingStayDuration: 14 }
      : { platformName: 'Test Land' },
  ),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../../utils/api" the page imports.
// Mocking the real file path gives us the instance it actually calls.
const mockedApiGet = jest.requireMock('../utils/api.js').default
  .get as jest.Mock;

const setTab = (tab: string) => {
  (useRouter as unknown as jest.Mock).mockReturnValue({
    query: { tab },
    pathname: '/dashboard/citizens/[tab]',
    asPath: `/dashboard/citizens/${tab}`,
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  });
};

const applicants = [
  {
    _id: 'user-1',
    screenname: 'Ada Lovelace',
    email: 'ada@example.com',
    roles: ['default'],
    lastactive: '2026-08-29T10:00:00.000Z',
    walletAddress: '0x1111111111111111111111111111111111111111',
    kycPassed: true,
    subscription: { plan: 'wanderer' },
    stats: {
      wallet: { tdf: 30, presence: 41, sweat: 6 },
      all_time: { presence: 20 },
    },
    vouched: [{}, {}, {}],
    citizenship: {
      why: 'I live here',
      appliedAt: '2026-01-01',
      status: 'pending-payment',
      tokensToFinance: 20,
      totalToPayInFiat: 1500,
    },
  },
  {
    _id: 'user-2',
    screenname: 'Grace Hopper',
    email: 'grace@example.com',
    roles: ['default'],
    stats: { wallet: { tdf: 0 }, all_time: { presence: 2 } },
    citizenship: { appliedAt: '2026-02-01' },
  },
];

const citizens = [
  {
    _id: 'citizen-1',
    screenname: 'Alan Turing',
    roles: ['member'],
    created: '2026-01-01',
    stats: { wallet: { tdf: 30 } },
  },
  {
    _id: 'citizen-2',
    screenname: 'Katherine Johnson',
    roles: ['citizen'],
    created: '2026-01-01',
    stats: { wallet: { tdf: 30 } },
  },
];

/** Both citizens voted recently, so presence is the only variable under test. */
const recentProposal = {
  votes: {
    yes: [
      { userId: 'citizen-1', votedAt: new Date().toISOString() },
      { userId: 'citizen-2', votedAt: new Date().toISOString() },
    ],
    no: [],
    abstain: [],
  },
};

/**
 * The strip loads the applications list on every tab, so the mock answers by
 * which `where` it was handed rather than replaying one list for every call.
 */
const candidates = [
  {
    _id: 'cand-1',
    screenname: 'Barely Ready',
    email: 'barely@example.com',
    roles: ['default'],
    // 7 of 14 nights, no tokens -> 30% ready, under the old 60% cutoff.
    stats: { wallet: { tdf: 0 }, all_time: { presence: 7 } },
  },
  {
    _id: 'cand-2',
    screenname: 'Nearly There',
    email: 'nearly@example.com',
    roles: ['default'],
    stats: { wallet: { tdf: 30 }, all_time: { presence: 14 } },
  },
];

const makePlatform = (
  overrides: {
    applications?: any[];
    citizens?: any[];
    recommended?: any[];
  } = {},
) => ({
  user: {
    get: jest.fn(async (filter: any) => {
      const where = filter?.where || {};
      if (where.$and) {
        return { results: { toJS: () => overrides.applications ?? [] } };
      }
      if (where.roles?.$in) {
        return { results: { toJS: () => overrides.citizens ?? [] } };
      }
      return { results: { toJS: () => overrides.recommended ?? [] } };
    }),
    getCount: jest.fn().mockResolvedValue({ results: citizens.length }),
  },
  financeapplication: {
    get: jest.fn().mockResolvedValue({ results: { toJS: () => [] } }),
  },
});

describe('CitizensFunnelPage', () => {
  const citizenshipFlag = process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP = 'true';
    mockedApiGet.mockReset();
    mockedApiGet.mockResolvedValue({ data: { results: [] } });
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'me', roles: ['admin'] },
    });
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => true });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP = citizenshipFlag;
  });

  it('loads the applications tab exactly once', async () => {
    setTab('applications');
    const platform = makePlatform({ applications: applicants });
    (usePlatform as jest.Mock).mockReturnValue({ platform });

    renderWithNextIntl(<CitizensFunnelPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    // Let any runaway effect re-fire before counting.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(platform.user.get).toHaveBeenCalledTimes(1);
    expect(platform.user.getCount).toHaveBeenCalledTimes(1);
    expect(platform.financeapplication.get).toHaveBeenCalledTimes(1);
  });

  it('counts every application in the stage strip, not just one page', async () => {
    setTab('applications');
    const platform = makePlatform({ applications: applicants });
    (usePlatform as jest.Mock).mockReturnValue({ platform });

    renderWithNextIntl(<CitizensFunnelPage />);

    await screen.findByText('Ada Lovelace');
    // Ada has nights, tokens and 3 of the 1 required vouches -> ready.
    const ready = screen.getByRole('button', { name: /ready/i });
    expect(ready.textContent).toContain('1');
    // Grace has 2 nights and no tokens -> presence.
    const presence = screen.getByRole('button', { name: /presence/i });
    expect(presence.textContent).toContain('1');
  });

  it('reads window presence in one batched booking query, not one per citizen', async () => {
    setTab('citizens');
    const platform = makePlatform({ applications: applicants, citizens });
    (usePlatform as jest.Mock).mockReturnValue({ platform });
    mockedApiGet.mockImplementation(async (url: string) => {
      if (url === '/booking') {
        return {
          data: {
            results: [
              { createdBy: 'citizen-1', duration: 30 },
              { createdBy: 'citizen-1', duration: 5 },
            ],
          },
        };
      }
      if (url === '/proposal') return { data: { results: [recentProposal] } };
      return { data: { results: [] } };
    });

    renderWithNextIntl(<CitizensFunnelPage />);

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument();
    await waitFor(() => {
      const bookingCalls = mockedApiGet.mock.calls.filter(
        ([url]) => url === '/booking',
      );
      expect(bookingCalls).toHaveLength(1);
    });
    // 35 nights clears the 28-night floor; the citizen with none is at risk.
    expect(screen.getByText('Met')).toBeInTheDocument();
    expect(screen.getByText('At risk (1)')).toBeInTheDocument();
  });

  it('ranks every candidate on Recommended, with no readiness cutoff', async () => {
    setTab('recommended');
    const platform = makePlatform({
      applications: applicants,
      recommended: candidates,
    });
    (usePlatform as jest.Mock).mockReturnValue({ platform });

    renderWithNextIntl(<CitizensFunnelPage />);

    // 30% ready — the old threshold filtered this person out entirely.
    expect(await screen.findByText('Barely Ready')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    // Most ready first.
    const names = screen
      .getAllByText(/Nearly There|Barely Ready/)
      .map((el) => el.textContent);
    expect(names).toEqual(['Nearly There', 'Barely Ready']);
  });

  it('keeps the stage strip above Recommended and Config', async () => {
    for (const tab of ['recommended', 'config'] as const) {
      setTab(tab);
      const platform = makePlatform({
        applications: applicants,
        recommended: candidates,
      });
      (usePlatform as jest.Mock).mockReturnValue({ platform });

      const { unmount } = renderWithNextIntl(<CitizensFunnelPage />);

      const strip = await screen.findByRole('toolbar', {
        name: 'Application stages',
      });
      // Real counts, not zeroes: Ada is ready, Grace is at presence.
      await waitFor(() => {
        expect(
          within(strip).getByRole('button', { name: /ready/i }).textContent,
        ).toContain('1');
      });
      expect(
        within(strip).getByRole('button', { name: /citizens/i }).textContent,
      ).toContain(String(citizens.length));
      unmount();
    }
  });

  it('shows the wallet, KYC and financing detail on an application card', async () => {
    setTab('applications');
    const platform = makePlatform({ applications: applicants });
    (usePlatform as jest.Mock).mockReturnValue({ platform });

    renderWithNextIntl(<CitizensFunnelPage />);

    await screen.findByText('Ada Lovelace');
    expect(screen.getByText('30 $TDF')).toBeInTheDocument();
    expect(screen.getByText('41 $Presence')).toBeInTheDocument();
    expect(screen.getByText('6 $Sweat')).toBeInTheDocument();
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.getByText('Wanderer')).toBeInTheDocument();
    expect(screen.getByText('pending-payment')).toBeInTheDocument();
    expect(screen.getByText('20 TDF')).toBeInTheDocument();
    expect(screen.getByText('€1500')).toBeInTheDocument();
    expect(screen.getByText(/0x1111/)).toBeInTheDocument();
    // Grace has none of it — the pills stay off rather than rendering zeroes.
    expect(screen.queryByText('0 $TDF')).not.toBeInTheDocument();
  });

  it('surfaces a failed read instead of showing an empty funnel', async () => {
    setTab('applications');
    const platform = makePlatform({ applications: applicants });
    // The platform context resolves with `undefined` when a read fails.
    platform.user.get.mockResolvedValue(undefined);
    (usePlatform as jest.Mock).mockReturnValue({ platform });

    renderWithNextIntl(<CitizensFunnelPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load citizen funnel data.',
    );
  });

  it('treats unreadable booking data as unknown rather than zero nights', async () => {
    setTab('citizens');
    const platform = makePlatform({ applications: applicants, citizens });
    (usePlatform as jest.Mock).mockReturnValue({ platform });
    mockedApiGet.mockImplementation(async (url: string) => {
      if (url === '/booking') throw new Error('401');
      if (url === '/proposal') return { data: { results: [recentProposal] } };
      return { data: { results: [] } };
    });

    renderWithNextIntl(<CitizensFunnelPage />);

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument();
    expect(screen.getByText('At risk (0)')).toBeInTheDocument();
    expect(
      screen.getAllByText('Presence for this window could not be read.').length,
    ).toBe(2);
  });
});
