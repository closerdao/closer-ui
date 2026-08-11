import {
  filterBlocks,
  getDashboardBlocks,
  getPerformanceBlocks,
  getVisibleDashboardBlockIds,
  getVisiblePerformanceBlockIds,
} from '../dashboardBlocks';
import { DashboardFeatures } from '../dashboardFeatures';

const noFeatures: DashboardFeatures = {
  isBookingEnabled: false,
  isSubscriptionsEnabled: false,
  isEventsEnabled: false,
  isVolunteeringEnabled: false,
  isCitizenshipEnabled: false,
  isTokenSaleEnabled: false,
  isWeb3Enabled: false,
  isAffiliateEnabled: false,
  isGovernanceEnabled: false,
  isApplicationsEnabled: false,
  isFundraiserEnabled: false,
  isLearningHubEnabled: false,
  isPaymentEnabled: false,
};

const allowAll = () => true;

describe('getDashboardBlocks', () => {
  it('gates bookings, revenue and subscriptions on their features', () => {
    const off = getDashboardBlocks(noFeatures);
    const byId = Object.fromEntries(off.map((b) => [b.id, b.enabled]));

    expect(byId.bookings).toBe(false);
    expect(byId.revenue).toBe(false);
    expect(byId.subscriptions).toBe(false);
    // Stats work on any platform — every app has accounts.
    expect(byId.stats).toBe(true);
  });

  it('enables a block once its feature is on', () => {
    const blocks = getDashboardBlocks({
      ...noFeatures,
      isBookingEnabled: true,
      isPaymentEnabled: true,
    });
    const byId = Object.fromEntries(blocks.map((b) => [b.id, b.enabled]));

    expect(byId.bookings).toBe(true);
    expect(byId.revenue).toBe(true);
    expect(byId.subscriptions).toBe(false);
  });
});

describe('filterBlocks', () => {
  const blocks = getDashboardBlocks({
    ...noFeatures,
    isBookingEnabled: true,
    isPaymentEnabled: true,
    isSubscriptionsEnabled: true,
  });

  it('drops disabled blocks', () => {
    const ids = filterBlocks(
      getDashboardBlocks(noFeatures),
      ['admin'],
      allowAll,
    ).map((block) => block.id);

    expect(ids).not.toContain('bookings');
    expect(ids).toContain('stats');
  });

  it('drops blocks the user has no role for', () => {
    const ids = filterBlocks(blocks, ['space-host'], allowAll).map(
      (block) => block.id,
    );

    expect(ids).toContain('stats');
    expect(ids).toContain('bookings');
    // Revenue is admin/team/accounting only.
    expect(ids).not.toContain('revenue');
    expect(ids).not.toContain('subscriptions');
  });

  it('drops blocks the RBAC config denies even when the role matches', () => {
    const hasAccess = (page: string) => page !== 'Revenue';
    const ids = filterBlocks(blocks, ['admin'], hasAccess).map(
      (block) => block.id,
    );

    expect(ids).not.toContain('revenue');
    expect(ids).toContain('bookings');
  });

  it('returns nothing for a user with no matching roles', () => {
    expect(filterBlocks(blocks, [], allowAll)).toEqual([]);
    expect(filterBlocks(blocks, ['member'], allowAll)).toEqual([]);
  });
});

describe('getPerformanceBlocks', () => {
  it('shows no funnel on a platform with every feature off', () => {
    expect(
      getPerformanceBlocks(noFeatures).filter((block) => block.enabled),
    ).toEqual([]);
  });

  it('gates the stays funnel on booking, which was previously ungated', () => {
    const enabledIds = (features: Partial<DashboardFeatures>) =>
      getPerformanceBlocks({ ...noFeatures, ...features })
        .filter((block) => block.enabled)
        .map((block) => block.id);

    expect(enabledIds({})).not.toContain('stays');
    expect(enabledIds({ isBookingEnabled: true })).toContain('stays');
  });

  it('gates the applications funnel on the applications config', () => {
    const blocks = getPerformanceBlocks({
      ...noFeatures,
      isApplicationsEnabled: true,
    });

    expect(
      blocks.find((block) => block.id === 'applications')?.enabled,
    ).toBe(true);
    expect(blocks.find((block) => block.id === 'stays')?.enabled).toBe(false);
  });

  it('maps each remaining funnel to its own feature', () => {
    const enabled = (features: Partial<DashboardFeatures>) =>
      getPerformanceBlocks({ ...noFeatures, ...features })
        .filter((block) => block.enabled)
        .map((block) => block.id);

    expect(enabled({ isWeb3Enabled: true })).toEqual(['tokenSales']);
    expect(enabled({ isSubscriptionsEnabled: true })).toEqual([
      'subscriptions',
    ]);
    expect(enabled({ isCitizenshipEnabled: true })).toEqual(['citizenship']);
  });
});

describe('getVisiblePerformanceBlockIds', () => {
  it('lists funnels in display order for the enabled features', () => {
    expect(
      getVisiblePerformanceBlockIds(
        {
          ...noFeatures,
          isBookingEnabled: true,
          isApplicationsEnabled: true,
          isSubscriptionsEnabled: true,
        },
        ['admin'],
        allowAll,
      ),
    ).toEqual(['stays', 'applications', 'subscriptions']);
  });

  it('does not depend on roles, since the page itself is RBAC gated', () => {
    expect(
      getVisiblePerformanceBlockIds(
        { ...noFeatures, isApplicationsEnabled: true },
        [],
        allowAll,
      ),
    ).toEqual(['applications']);
  });
});

describe('getVisibleDashboardBlockIds', () => {
  it('composes feature gating, roles and RBAC into a list of ids', () => {
    expect(
      getVisibleDashboardBlockIds(
        { ...noFeatures, isBookingEnabled: true },
        ['admin'],
        allowAll,
      ),
    ).toEqual(['stats', 'bookings', 'actions']);
  });
});
