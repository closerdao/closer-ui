import { DashboardFeatures } from './dashboardFeatures';

/**
 * Which sections the dashboard renders, and under what conditions. Same shape
 * and filtering rules as `dashboardLinks` so a feature is switched on in one
 * place for both the nav and the page body.
 */
export type DashboardBlockId =
  | 'stats'
  | 'bookings'
  | 'revenue'
  | 'subscriptions'
  | 'actions';

export interface DashboardBlock {
  id: DashboardBlockId;
  enabled: boolean;
  rbacPage?: string;
  roles?: string[];
}

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

export const filterDashboardBlocks = (
  blocks: DashboardBlock[],
  userRoles: string[],
  hasAccess: (page: string) => boolean,
): DashboardBlock[] =>
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
  filterDashboardBlocks(getDashboardBlocks(features), userRoles, hasAccess).map(
    (block) => block.id,
  );
