interface DashboardLink {
  label: string;
  url: string;
  rbacPage: string;
}

type TranslationFunction = (key: string) => string;

export const getDashboardLinks = (
  t: TranslationFunction,
  isBookingEnabled?: boolean,
): DashboardLink[] => {
  const isTokenEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isAffiliateEnabled =
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE === 'true';

  const baseLinks: DashboardLink[] = [
    {
      label: t('navigation_dashboard'),
      url: '/dashboard',
      rbacPage: 'Dashboard',
    },
    {
      label: t('navigation_performance'),
      url: '/dashboard/performance',
      rbacPage: 'Performance',
    },
    {
      label: t('navigation_revenue'),
      url: '/dashboard/revenue',
      rbacPage: 'Revenue',
    },
  ];

  const bookingLinks: DashboardLink[] = isBookingEnabled
    ? [
        {
          label: t('navigation_all_bookings'),
          url: '/bookings/all',
          rbacPage: 'Bookings',
        },
        {
          label: t('navigation_booking_requests'),
          url: '/bookings/requests',
          rbacPage: 'Bookings',
        },
        {
          label: t('navigation_current_bookings'),
          url: '/bookings/current',
          rbacPage: 'Bookings',
        },
        {
          label: t('navigation_booking_calendar'),
          url: '/bookings/calendar',
          rbacPage: 'Bookings',
        },
        {
          label: t('navigation_edit_listings'),
          url: '/listings',
          rbacPage: 'Listings',
        },
        {
          label: t('navigation_food'),
          url: '/food',
          rbacPage: 'Food',
        },
      ]
    : [];

  const adminLinks: DashboardLink[] = [
    {
      label: t('navigation_user_list'),
      url: '/admin/manage-users',
      rbacPage: 'UserManagement',
    },
    {
      label: t('navigation_platform_settings'),
      url: '/admin/config',
      rbacPage: 'PlatformSettings',
    },
    {
      label: t('navigation_rbac'),
      url: '/admin/rbac',
      rbacPage: 'RBAC',
    },
    {
      label: t('navigation_learn_settings'),
      url: '/admin/learn',
      rbacPage: 'LearnSettings',
    },
  ];

  const featureLinks: DashboardLink[] = [
    ...(isAffiliateEnabled
      ? [
          {
            label: t('navigation_affiliate_settings'),
            url: '/dashboard/affiliate',
            rbacPage: 'AffiliateSettings',
          },
        ]
      : []),
    ...(isTokenEnabled
      ? [
          {
            label: t('navigation_token_sales'),
            url: '/dashboard/token-sales',
            rbacPage: 'TokenSales',
          },
        ]
      : []),
    {
      label: t('navigation_expense_tracking'),
      url: '/dashboard/expense-tracking',
      rbacPage: 'ExpenseTracking',
    },
  ];

  return [...baseLinks, ...bookingLinks, ...adminLinks, ...featureLinks];
};
