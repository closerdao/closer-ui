export interface DashboardLink {
  label: string;
  url: string;
  rbacPage: string;
  enabled?: boolean;
  roles?: string[];
}

type TranslationFunction = (key: string) => string;

interface DashboardLinksConfig {
  isBookingEnabled?: boolean;
  isGovernanceEnabled?: boolean;
  isLearningHubEnabled?: boolean;
  isAffiliateEnabled?: boolean;
  isTokenEnabled?: boolean;
}

export const getDashboardLinks = (
  t: TranslationFunction,
  config: DashboardLinksConfig = {},
): DashboardLink[] => {
  const {
    isBookingEnabled = false,
    isGovernanceEnabled = false,
    isLearningHubEnabled = true,
    isAffiliateEnabled = process.env.NEXT_PUBLIC_FEATURE_AFFILIATE === 'true',
    isTokenEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true',
  } = config;

  const baseLinks: DashboardLink[] = [
    {
      label: t('navigation_dashboard'),
      url: '/dashboard',
      rbacPage: 'Dashboard',
      enabled: true,
      roles: ['admin', 'team'],
    },
    {
      label: t('navigation_performance'),
      url: '/dashboard/performance',
      rbacPage: 'Performance',
      enabled: true,
      roles: ['admin', 'team'],
    },
    {
      label: t('navigation_revenue'),
      url: '/dashboard/revenue',
      rbacPage: 'Revenue',
      enabled: true,
      roles: ['admin', 'team'],
    },
    {
      label: t('navigation_governance'),
      url: '/governance',
      rbacPage: 'Governance',
      enabled: isGovernanceEnabled,
      roles: ['member'],
    },
    {
      label: t('navigation_token_sales'),
      url: '/dashboard/token-sales',
      rbacPage: 'TokenSales',
      enabled: isTokenEnabled,
      roles: ['admin', 'team'],
    },
    {
      label: t('navigation_expense_tracking'),
      url: '/dashboard/expense-tracking',
      rbacPage: 'ExpenseTracking',
      enabled: true,
      roles: ['admin', 'team'],
    },
  ];

  const bookingLinks: DashboardLink[] = [
    {
      label: t('navigation_booking_requests'),
      url: '/bookings/requests',
      rbacPage: 'Bookings',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
    {
      label: t('navigation_all_bookings'),
      url: '/bookings/all',
      rbacPage: 'Bookings',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
    {
      label: t('navigation_current_bookings'),
      url: '/bookings/current',
      rbacPage: 'Bookings',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
    {
      label: t('navigation_booking_calendar'),
      url: '/bookings/calendar',
      rbacPage: 'Bookings',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
    {
      label: t('navigation_edit_listings'),
      url: '/listings',
      rbacPage: 'Listings',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
    {
      label: t('navigation_food'),
      url: '/food',
      rbacPage: 'Food',
      enabled: isBookingEnabled,
      roles: ['admin', 'team', 'space-host'],
    },
  ];

  const adminLinks: DashboardLink[] = [
    {
      label: t('navigation_user_list'),
      url: '/dashboard/admin/manage-users',
      rbacPage: 'UserManagement',
      enabled: true,
      roles: ['admin', 'team'],
    },
    {
      label: t('navigation_platform_settings'),
      url: '/dashboard/admin/config',
      rbacPage: 'PlatformSettings',
      enabled: true,
      roles: ['admin'],
    },
    {
      label: t('navigation_email_templates'),
      url: '/dashboard/admin/emails',
      rbacPage: 'PlatformSettings',
      enabled: true,
      roles: ['admin'],
    },
    {
      label: t('navigation_rbac'),
      url: '/dashboard/admin/rbac',
      rbacPage: 'RBAC',
      enabled: true,
      roles: ['admin'],
    },
    {
      label: t('navigation_learn_settings'),
      url: '/dashboard/admin/learn',
      rbacPage: 'LearnSettings',
      enabled: isLearningHubEnabled,
      roles: ['admin'],
    },
  ];

  const featureLinks: DashboardLink[] = [
    {
      label: t('navigation_affiliate_settings'),
      url: '/dashboard/affiliate',
      rbacPage: 'AffiliateSettings',
      enabled: isAffiliateEnabled,
      roles: [],
    },
  ];

  return [...baseLinks, ...bookingLinks, ...adminLinks, ...featureLinks];
};

export const filterDashboardLinks = (
  links: DashboardLink[],
  userRoles: string[],
  hasAccess: (page: string) => boolean,
): DashboardLink[] => {
  return links.filter((link) => {
    if (link.enabled === false) return false;
    if (link.rbacPage && !hasAccess(link.rbacPage)) return false;
    if (link.roles && link.roles.length > 0) {
      return link.roles.some((role) => userRoles.includes(role));
    }
    return true;
  });
};
