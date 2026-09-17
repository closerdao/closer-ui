import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { useConfig } from '../hooks/useConfig';
import useRBAC from '../hooks/useRBAC';
import ApplicationsDashboardPage from '../pages/dashboard/applications';
import { syncLeads } from '../utils/leads.utils';
import { fetchVillagesByApplicationIds } from '../utils/villageApplication.utils';
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

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(() => ({ platformName: 'Test Land' })),
}));

jest.mock('../hooks/useConfig', () => ({
  useConfig: jest.fn(() => ({ applications: { enabled: true } })),
}));

jest.mock('../utils/leads.utils', () => ({
  __esModule: true,
  syncLeads: jest.fn(async () => undefined),
}));

jest.mock('../utils/villageApplication.utils', () => ({
  ...jest.requireActual('../utils/villageApplication.utils'),
  fetchVillagesByApplicationIds: jest.fn(async () => ({})),
}));

const applications = [
  {
    _id: 'app-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+351000000',
    status: 'open',
    created: '2026-08-01T10:00:00.000Z',
    dream: 'A house by the river',
  },
  {
    _id: 'app-2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    status: 'rejected',
    created: '2026-07-01T10:00:00.000Z',
    fields: {
      projectCommunityName: 'Riverbank',
      community_size: '15–50 people',
      hasLand: true,
      empty: '',
    },
  },
];

const makePlatform = () => ({
  application: {
    get: jest.fn().mockResolvedValue({ results: { toJS: () => applications } }),
    getCount: jest.fn().mockResolvedValue({ results: applications.length }),
    patch: jest.fn().mockResolvedValue({}),
  },
});

describe('ApplicationsDashboardPage', () => {
  let platform: ReturnType<typeof makePlatform>;
  const federationFlag = process.env.NEXT_PUBLIC_IS_FEDERATION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_FEDERATION = federationFlag;
  });

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_IS_FEDERATION;
    (syncLeads as jest.Mock).mockClear();
    (syncLeads as jest.Mock).mockResolvedValue(undefined);
    (fetchVillagesByApplicationIds as jest.Mock).mockClear();
    (fetchVillagesByApplicationIds as jest.Mock).mockResolvedValue({});
    platform = makePlatform();
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'user-1', roles: ['admin'] },
    });
    (usePlatform as jest.Mock).mockReturnValue({ platform });
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => true });
    (useConfig as jest.Mock).mockReturnValue({
      applications: { enabled: true },
    });
  });

  it('lists every application regardless of status', async () => {
    renderWithNextIntl(<ApplicationsDashboardPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();

    // No status filter is applied by default, so all applications are fetched.
    await waitFor(() => {
      expect(platform.application.get).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
        { force: true },
      );
    });
  });

  it('renders an email button pointing at the applicant', async () => {
    renderWithNextIntl(<ApplicationsDashboardPage />);

    await screen.findByText('Ada Lovelace');

    const emailLinks = screen.getAllByRole('link', { name: /email/i });
    expect(emailLinks[0]).toHaveAttribute(
      'href',
      `mailto:ada@example.com?subject=${encodeURIComponent(
        'Your application to Test Land',
      )}`,
    );
    expect(emailLinks[1]).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:grace@example.com'),
    );
  });

  it('renders free-form `fields` answers with humanized labels', async () => {
    renderWithNextIntl(<ApplicationsDashboardPage />);

    await screen.findByText('Grace Hopper');
    await userEvent.click(screen.getAllByText('Show answers')[1]);

    expect(screen.getByText('Project community name')).toBeInTheDocument();
    expect(screen.getByText('Riverbank')).toBeInTheDocument();
    expect(screen.getByText('Community size')).toBeInTheDocument();
    expect(screen.getByText('15–50 people')).toBeInTheDocument();
    // Booleans read as words, and unanswered questions are dropped entirely.
    expect(screen.getByText('Has land')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });

  it('renders model answers and skips the ones left blank', async () => {
    renderWithNextIntl(<ApplicationsDashboardPage />);

    await screen.findByText('Ada Lovelace');
    await userEvent.click(screen.getAllByText('Show answers')[0]);

    expect(screen.getByText('What do you dream of?')).toBeInTheDocument();
    expect(screen.getByText('A house by the river')).toBeInTheDocument();
    expect(
      screen.queryByText('What does home mean to you?'),
    ).not.toBeInTheDocument();
  });

  it('does not offer village creation outside a federation', async () => {
    renderWithNextIntl(<ApplicationsDashboardPage />);

    await screen.findByText('Ada Lovelace');

    expect(
      screen.queryByRole('link', { name: 'Create village' }),
    ).not.toBeInTheDocument();
    expect(fetchVillagesByApplicationIds).not.toHaveBeenCalled();
  });

  describe('in a federation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_IS_FEDERATION = 'true';
    });

    it('offers to create a village pre-filled from the application', async () => {
      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      const links = await screen.findAllByRole('link', {
        name: 'Create village',
      });
      expect(links[0]).toHaveAttribute(
        'href',
        '/villages/create?applicationId=app-1',
      );
      expect(links).toHaveLength(2);
    });

    it('links to the village once one has been created', async () => {
      (fetchVillagesByApplicationIds as jest.Mock).mockResolvedValue({
        'app-1': { _id: 'v1', slug: 'riverbank', applicationId: 'app-1' },
      });

      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      expect(
        await screen.findByRole('link', { name: 'View village' }),
      ).toHaveAttribute('href', '/villages/riverbank');
      // The application without a village still offers to create one.
      expect(
        screen.getAllByRole('link', { name: 'Create village' }),
      ).toHaveLength(1);
    });

    it('looks every application on the page up in one request', async () => {
      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      await waitFor(() => {
        expect(fetchVillagesByApplicationIds).toHaveBeenCalledWith([
          'app-1',
          'app-2',
        ]);
      });
    });
  });

  describe('links to the records the application led to', () => {
    const linked = [
      {
        ...applications[0],
        links: {
          lead: 'lead-1',
          village: 'v1',
          villageSlug: 'riverbank',
          user: 'user-9',
          userSlug: 'ada',
          updated: '2026-08-02T10:00:00.000Z',
        },
      },
      applications[1],
    ];

    beforeEach(() => {
      platform.application.get.mockResolvedValue({
        results: { toJS: () => linked },
      });
    });

    it('renders village, lead and account links from `links`', async () => {
      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      expect(
        screen.getByRole('link', { name: 'View village' }),
      ).toHaveAttribute('href', '/villages/riverbank');
      expect(screen.getByRole('link', { name: 'View lead' })).toHaveAttribute(
        'href',
        '/dashboard/leads/all?lead=lead-1',
      );
      expect(
        screen.getByRole('link', { name: 'View account' }),
      ).toHaveAttribute('href', '/members/ada');
      // The sync only reaches applications it has linked; the rest show nothing.
      expect(screen.getAllByRole('link', { name: /view/i })).toHaveLength(3);
    });

    it('does not offer to create a village the sync already linked', async () => {
      process.env.NEXT_PUBLIC_IS_FEDERATION = 'true';

      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      expect(
        await screen.findAllByRole('link', { name: 'Create village' }),
      ).toHaveLength(1);
      expect(
        screen.getByRole('link', { name: 'View village' }),
      ).toHaveAttribute('href', '/villages/riverbank');
    });
  });

  describe('rebuild links', () => {
    it('runs the leads sync and reloads the list', async () => {
      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');
      const callsBefore = platform.application.get.mock.calls.length;

      await userEvent.click(
        screen.getByRole('button', { name: 'Rebuild links' }),
      );

      await waitFor(() => {
        expect(syncLeads).toHaveBeenCalledTimes(1);
        expect(platform.application.get.mock.calls.length).toBeGreaterThan(
          callsBefore,
        );
      });
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('shows the API error when the sync fails', async () => {
      (syncLeads as jest.Mock).mockRejectedValueOnce(
        new Error('Sync exploded'),
      );

      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');
      await userEvent.click(
        screen.getByRole('button', { name: 'Rebuild links' }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Sync exploded',
      );
    });

    it('is hidden from users who cannot run the sync', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { _id: 'user-1', roles: ['steward'] },
      });

      renderWithNextIntl(<ApplicationsDashboardPage />);

      await screen.findByText('Ada Lovelace');

      expect(
        screen.queryByRole('button', { name: 'Rebuild links' }),
      ).toBeNull();
    });
  });

  it('denies access when the user lacks the Applications permission', () => {
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => false });

    renderWithNextIntl(<ApplicationsDashboardPage />);

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(platform.application.get).not.toHaveBeenCalled();
  });

  it('is gone when the applications config is disabled', () => {
    (useConfig as jest.Mock).mockReturnValue({
      applications: { enabled: false },
    });

    renderWithNextIntl(<ApplicationsDashboardPage />);

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(platform.application.get).not.toHaveBeenCalled();
  });
});
