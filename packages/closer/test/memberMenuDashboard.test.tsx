import React from 'react';

import MemberMenu from '../components/MemberMenu';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import useRBAC from '../hooks/useRBAC';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../hooks/useBuyTokens', () => ({
  useBuyTokens: () => ({
    getCurrentSupplyWithoutWallet: jest.fn(() => Promise.resolve(0)),
  }),
}));

// A fresh array each render would re-fire the menu-building effect forever,
// so hand back one stable reference.
const mockEmptyPageMenuSections: unknown[] = [];
jest.mock('../hooks/usePageMenuSections', () => ({
  usePageMenuSections: () => mockEmptyPageMenuSections,
}));

jest.mock('../components/Profile', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/Wallet', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/ReportABug', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/FinancedTokenMenuWidget', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { results: [] } })) },
  formatSearch: () => '',
}));

const flags = {
  ready: true,
  reserveToken: 'EURt',
  isBookingEnabled: true,
  areSubscriptionsEnabled: true,
  isVolunteeringEnabled: true,
  isEventsEnabled: true,
  isCommunityEnabled: true,
  isGovernanceEnabled: true,
  isLearningHubEnabled: true,
  isBlogEnabled: true,
  isCitizenshipEnabled: true,
  isRolesEnabled: true,
  isFaqEnabled: true,
  isAffiliateEnabled: true,
  isCohousingEnabled: true,
  isApplicationsEnabled: true,
};

// Grabs the collapsed `Dashboard` section before opening it — afterwards
// "Dashboard" also matches the overview link nested inside it.
const openDashboardSection = async () => {
  const heading = await screen.findByText('Dashboard');
  const section = heading.closest('div.mb-1') as HTMLElement;
  await userEvent.click(heading);
  return section;
};

async function renderMenu(appName: string) {
  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'admin-1', roles: ['admin'] },
    logout: jest.fn(),
  });
  (useRBAC as jest.Mock).mockReturnValue({
    hasAccess: () => true,
    rbacLiveRevision: 0,
  });

  renderWithNextIntl(<MemberMenu {...flags} appName={appName} />);
  return openDashboardSection();
}

describe.each(['tdf', 'moos'])('MemberMenu dashboard section (%s)', (app) => {
  it('groups the dashboard links under category headings', async () => {
    const section = await renderMenu(app);

    const headings = Array.from(section.querySelectorAll('div.uppercase')).map(
      (node) => node.textContent,
    );

    expect(headings).toEqual([
      'Overview',
      'Finance',
      'Community',
      'Bookings',
      'Settings',
    ]);
  });

  it('links to every dashboard page', async () => {
    const section = await renderMenu(app);

    const urls = [
      '/dashboard',
      '/dashboard/performance',
      '/dashboard/metrics',
      '/dashboard/revenue',
      '/dashboard/expense-tracking',
      '/dashboard/engagement',
      '/dashboard/applications',
      '/dashboard/cohousing',
      '/dashboard/admin/manage-users',
      '/dashboard/admin/config',
      '/dashboard/admin/emails',
      '/dashboard/pages',
      '/dashboard/theming',
      '/dashboard/admin/rbac',
      '/dashboard/admin/learn',
      '/dashboard/affiliate',
    ];

    const hrefs = within(section)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));

    urls.forEach((url) => expect(hrefs).toContain(url));
  });
});

describe('MemberMenu dashboard section — filtering', () => {
  it('drops a category whose links are all hidden by RBAC', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { _id: 'accountant-1', roles: ['accounting'] },
      logout: jest.fn(),
    });
    (useRBAC as jest.Mock).mockReturnValue({
      hasAccess: (page: string) => page === 'ExpenseTracking',
      rbacLiveRevision: 0,
    });

    renderWithNextIntl(<MemberMenu {...flags} appName="moos" />);

    // Expense tracking is the only surviving link, so the section collapses to
    // a single entry and no category heading is drawn.
    expect(await screen.findByText('Expense Tracking')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });
});
