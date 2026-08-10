import {
  filterDashboardBlocks,
  getDashboardBlocks,
  getVisibleDashboardBlockIds,
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

describe('filterDashboardBlocks', () => {
  const blocks = getDashboardBlocks({
    ...noFeatures,
    isBookingEnabled: true,
    isPaymentEnabled: true,
    isSubscriptionsEnabled: true,
  });

  it('drops disabled blocks', () => {
    const ids = filterDashboardBlocks(
      getDashboardBlocks(noFeatures),
      ['admin'],
      allowAll,
    ).map((block) => block.id);

    expect(ids).not.toContain('bookings');
    expect(ids).toContain('stats');
  });

  it('drops blocks the user has no role for', () => {
    const ids = filterDashboardBlocks(blocks, ['space-host'], allowAll).map(
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
    const ids = filterDashboardBlocks(blocks, ['admin'], hasAccess).map(
      (block) => block.id,
    );

    expect(ids).not.toContain('revenue');
    expect(ids).toContain('bookings');
  });

  it('returns nothing for a user with no matching roles', () => {
    expect(filterDashboardBlocks(blocks, [], allowAll)).toEqual([]);
    expect(filterDashboardBlocks(blocks, ['member'], allowAll)).toEqual([]);
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
