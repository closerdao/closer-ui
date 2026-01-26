import Link from 'next/link';
import { useRouter } from 'next/router';

import { useTranslations } from 'next-intl';

import useRBAC from '../../hooks/useRBAC';

const DashboardMobileNav = ({
  isBookingEnabled,
}: {
  isBookingEnabled?: boolean;
}) => {
  const t = useTranslations();
  const router = useRouter();
  const path = router.pathname;
  const { hasAccess } = useRBAC();

  const isTokenEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const allLinks = [
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
    ...(isBookingEnabled
      ? [
          {
            label: t('navigation_bookings'),
            url: '/bookings/all',
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_edit_listings'),
            url: '/listings',
            rbacPage: 'Listings',
          },
        ]
      : []),
    {
      label: t('navigation_user_list'),
      url: '/admin/manage-users',
      rbacPage: 'UserManagement',
    },
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
      label: t('navigation_platform_settings'),
      url: '/admin/config',
      rbacPage: 'PlatformSettings',
    },
  ];

  const links = allLinks.filter((link) => hasAccess(link.rbacPage));

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="xl:hidden fixed top-20 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {links.map((link) => {
            const isActive =
              path === link.url ||
              (link.url !== '/dashboard' && path.startsWith(link.url));
            return (
              <Link
                key={link.url}
                href={link.url}
                className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-full transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default DashboardMobileNav;
