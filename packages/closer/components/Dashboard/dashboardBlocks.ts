import { DashboardFeatures } from './dashboardFeatures';

/**
 * Which sections the dashboard pages render, and under what conditions. Same
 * shape and filtering rules as `dashboardLinks` so a feature is switched on in
 * one place for the nav and the page bodies alike.
 */
export type DashboardBlockId =
  | 'stats'
  | 'bookings'
  | 'revenue'
  | 'subscriptions'
  | 'actions';

export type PerformanceBlockId =
  | 'stays'
  | 'applications'
  | 'tokenSales'
  | 'subscriptions'
  | 'citizenship';

export interface Block<Id extends string> {
  id: Id;
  enabled: boolean;
  rbacPage?: string;
  roles?: string[];
}

export type DashboardBlock = Block<DashboardBlockId>;
export type PerformanceBlock = Block<PerformanceBlockId>;

export const getDashboardBlocks = (
  features: DashboardFeatures,
): DashboardBlock[] => [
  {
    id: 'stats',
    enabled: true,
    rbacPage: 'Dashboard',
    roles: ['admin', 'team', 'space-host'],
  },
  {
    id: 'bookings',
    enabled: features.isBookingEnabled,
    rbacPage: 'Bookings',
    roles: ['admin', 'team', 'space-host'],
  },
  {
    id: 'revenue',
    // Revenue is charge-driven: without payments there is nothing to chart.
    enabled: features.isPaymentEnabled,
    rbacPage: 'Revenue',
    roles: ['admin', 'team', 'accounting'],
  },
  {
    id: 'subscriptions',
    enabled: features.isSubscriptionsEnabled,
    rbacPage: 'Dashboard',
    roles: ['admin', 'team'],
  },
  {
    id: 'actions',
    enabled: true,
    rbacPage: 'Dashboard',
    roles: ['admin', 'accounting'],
  },
];

/**
 * Every funnel on /dashboard/performance measures one feature, so a platform
 * that does not run that feature should not be shown an empty chart. RBAC is
 * already enforced page-wide, so these only carry the feature switch.
 */
export const getPerformanceBlocks = (
  features: DashboardFeatures,
): PerformanceBlock[] => [
  { id: 'stays', enabled: features.isBookingEnabled },
  { id: 'applications', enabled: features.isApplicationsEnabled },
  { id: 'tokenSales', enabled: features.isWeb3Enabled },
  { id: 'subscriptions', enabled: features.isSubscriptionsEnabled },
  { id: 'citizenship', enabled: features.isCitizenshipEnabled },
];

export const filterBlocks = <Id extends string>(
  blocks: Block<Id>[],
  userRoles: string[],
  hasAccess: (page: string) => boolean,
): Block<Id>[] =>
  blocks.filter((block) => {
    if (block.enabled === false) return false;
    if (block.rbacPage && !hasAccess(block.rbacPage)) return false;
    if (block.roles && block.roles.length > 0) {
      return block.roles.some((role) => userRoles.includes(role));
    }
    return true;
  });

export const getVisibleDashboardBlockIds = (
  features: DashboardFeatures,
  userRoles: string[],
  hasAccess: (page: string) => boolean,
): DashboardBlockId[] =>
  filterBlocks(getDashboardBlocks(features), userRoles, hasAccess).map(
    (block) => block.id,
  );

export const getVisiblePerformanceBlockIds = (
  features: DashboardFeatures,
  userRoles: string[],
  hasAccess: (page: string) => boolean,
): PerformanceBlockId[] =>
  filterBlocks(getPerformanceBlocks(features), userRoles, hasAccess).map(
    (block) => block.id,
  );
