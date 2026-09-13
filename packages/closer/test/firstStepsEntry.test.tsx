import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import DashboardPage from '../pages/dashboard/index';
import { renderWithNextIntl } from './utils';

/**
 * How an admin who has not finished setup finds `/first-steps`: sent there once
 * automatically, and by the banner every time after that.
 */

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: () => '',
  invalidateGetCache: jest.fn(),
}));

jest.mock('../components/Dashboard/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// The dashboard's own blocks fetch and chart; none of that is under test here.
jest.mock('../components/Dashboard/DashboardStats', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/Dashboard/DashboardActions', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../contexts/auth', () => ({ useAuth: jest.fn() }));
jest.mock('../contexts/platform', () => ({ usePlatform: jest.fn() }));

jest.mock('../hooks/useRBAC', () => {
  const hook = jest.fn();
  return { __esModule: true, default: hook, useRBAC: hook };
});
const mockUseRBAC = jest.requireMock('../hooks/useRBAC').useRBAC as jest.Mock;

const mockRouter = {
  query: {} as Record<string, any>,
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/dashboard',
  asPath: '/dashboard',
  locales: ['en'],
};
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));

/** Everything a required step needs, so setup reads as finished. */
const completeConfig = {
  general: {
    platformName: 'Moos',
    teamEmail: 'hi@moos.co',
    country: 'PT',
  },
  theming: { primaryColor: '#2f6f4e' },
  blog: { enabled: false },
};

const configRows = (bySlug: Record<string, any>) =>
  Object.entries(bySlug).map(([slug, value]) => ({ slug, value }));

const setup = ({
  config = {},
  settings = {},
  pages = [] as any[],
}: {
  config?: Record<string, any>;
  settings?: Record<string, any>;
  pages?: any[];
} = {}) => {
  const rows = configRows(config);
  const platform = {
    config: {
      get: jest.fn().mockResolvedValue({ results: { toJS: () => rows } }),
      getOne: jest.fn().mockResolvedValue({}),
      find: jest.fn(() => ({ toJS: () => rows })),
      patch: jest.fn().mockResolvedValue({}),
      post: jest.fn().mockResolvedValue({}),
    },
    user: { patch: jest.fn().mockResolvedValue({}) },
  };

  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'user-1', roles: ['admin'], settings },
    refetchUser: jest.fn(),
  });
  (usePlatform as jest.Mock).mockReturnValue({ platform });
  mockUseRBAC.mockReturnValue({ hasAccess: () => true });

  const api = jest.requireMock('../utils/api.js').default;
  api.get.mockImplementation((url: string) =>
    Promise.resolve({
      data: { results: url === '/page' ? pages : [] },
    }),
  );

  return platform;
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('an admin who has not finished setup', () => {
  it('is redirected to the wizard once', async () => {
    setup();
    renderWithNextIntl(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/first-steps');
    });
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });

  it('records the redirect so it never happens again', async () => {
    const platform = setup();
    renderWithNextIntl(<DashboardPage />);

    await waitFor(() => {
      expect(platform.user.patch).toHaveBeenCalled();
    });
    const [, payload] = (platform.user.patch as jest.Mock).mock.calls[0];
    expect(payload.settings.first_steps.hasBeenRedirected).toBe(true);
  });

  it('is not redirected again once the flag is set, but still sees the banner', async () => {
    setup({ settings: { first_steps: { hasBeenRedirected: true } } });
    renderWithNextIntl(<DashboardPage />);

    expect(await screen.findByTestId('first-steps-banner')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('can dismiss the banner', async () => {
    const platform = setup({
      settings: { first_steps: { hasBeenRedirected: true } },
    });
    renderWithNextIntl(<DashboardPage />);
    await screen.findByTestId('first-steps-banner');

    await userEvent.click(screen.getByLabelText('Dismiss'));

    await waitFor(() => {
      expect(platform.user.patch).toHaveBeenCalled();
    });
    const [, payload] = (platform.user.patch as jest.Mock).mock.calls[0];
    expect(payload.settings.first_steps.hasDismissedBanner).toBe(true);
  });

  it('hides a dismissed banner', async () => {
    setup({
      settings: {
        first_steps: { hasBeenRedirected: true, hasDismissedBanner: true },
      },
    });
    renderWithNextIntl(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('first-steps-banner')).toBeNull();
    });
  });
});

describe('an instance that is already set up', () => {
  it('neither redirects nor banners', async () => {
    setup({
      config: completeConfig,
      pages: [{ _id: '65f0abc', slug: '/' }],
      settings: {
        first_steps: {
          skipped: ['money', 'team'],
          hasDeployed: true,
        },
      },
    });
    renderWithNextIntl(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('first-steps-banner')).toBeNull();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('still banners while the settings have never been deployed', async () => {
    // Everything is filled in but nothing is live yet, which is the one case
    // where a village most needs telling.
    setup({
      config: completeConfig,
      pages: [{ _id: '65f0abc', slug: '/' }],
      settings: {
        first_steps: {
          skipped: ['money', 'team'],
          hasBeenRedirected: true,
        },
      },
    });
    renderWithNextIntl(<DashboardPage />);

    expect(await screen.findByTestId('first-steps-banner')).toBeTruthy();
  });
});

describe('a viewer without access to the wizard', () => {
  it('sees no banner and is not redirected', async () => {
    setup();
    mockUseRBAC.mockReturnValue({
      hasAccess: (page: string) => page !== 'FirstSteps',
    });
    renderWithNextIntl(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('first-steps-banner')).toBeNull();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
