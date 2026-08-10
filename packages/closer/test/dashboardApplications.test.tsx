import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { useConfig } from '../hooks/useConfig';
import useRBAC from '../hooks/useRBAC';
import ApplicationsDashboardPage from '../pages/dashboard/applications';
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

  beforeEach(() => {
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
