import Link from 'next/link';
import { useRouter } from 'next/router';

import { useTranslations } from 'next-intl';
import useRBAC from '../../hooks/useRBAC';

import BookingsIcon from '../icons/BookingsIcon';
import ListingsIcon from '../icons/ListingsIcon';
import NavBookingsIcon from '../icons/NavBookingsIcon';
import SettingsIcon from './SettingsIcon';
import UserListIcon from './UserListIcon';

const DashboardNav = ({ isBookingEnabled }: { isBookingEnabled?: boolean }) => {
  const t = useTranslations();
  const router = useRouter();
  const path = router.pathname;
  const { hasAccess } = useRBAC();

  // Define all possible links
  const allLinks = isBookingEnabled ? [
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
      label: t('navigation_bookings'),
      subsections: [
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
      ],
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
    {
      label: t('navigation_affiliate_settings'),
      url: '/dashboard/affiliate',
      rbacPage: 'AffiliateSettings',
    },
  ] : [
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
      rbacPage: 'LearningHubAdmin',
    },
    {
      label: t('navigation_affiliate_settings'),
      url: '/dashboard/affiliate',
      rbacPage: 'AffiliateSettings',
    },
  ];

  // Filter links based on RBAC permissions
  const DASHBOARD_LINKS = allLinks.filter(link => {
    // Check if the user has access to this page
    return hasAccess(link.rbacPage);
  });

  // Filter subsections based on RBAC permissions
  DASHBOARD_LINKS.forEach(link => {
    if (link.subsections) {
      link.subsections = link.subsections.filter(sublink => {
        // Check if the user has access to this page
        return hasAccess(sublink.rbacPage);
      });
    }
  });

  const getIcon = (label: string) => {
    switch (label) {
      case t('navigation_dashboard'):
        return <BookingsIcon />;
      case t('navigation_bookings'):
        return <NavBookingsIcon />;
      case t('navigation_user_list'):
        return <UserListIcon />;
      case t('navigation_edit_listings'):
        return <ListingsIcon color="black" />;
      case t('navigation_platform_settings'):
        return <SettingsIcon />;
      default:
        return <div className="w-[20px] h-[20px]"></div>;
    }
  };
  
  return (
    <nav className="hidden xl:block w-0 xl:w-[220px] flex-shrink-0 px-4 pt-6">
      {DASHBOARD_LINKS.map((link) => {
        return (
          <div key={link.label}>
            {link?.subsections ? (
              <div>
                <div
                  className={`${
                    path === link?.url ? 'bg-accent-light' : ''
                  } py-2 px-3  flex gap-2 rounded-full`}
                >
                  {getIcon(link?.label)} {link.label}
                </div>
                {link?.subsections.map((sublink) => {
                  return (
                    <Link
                      key={sublink.label}
                      className={`${
                        path === sublink?.url ? 'bg-accent-light' : ''
                      } pl-[40px] py-2 px-3 hover:bg-accent-light flex gap-2 rounded-full`}
                      href={sublink.url || ''}
                    >
                      {sublink.label}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Link
                className={`${
                  path === link?.url ? 'bg-accent-light' : ''
                } py-2 px-3 hover:bg-accent-light flex gap-2 rounded-full`}
                href={link?.url || ''}
              >
                {getIcon(link?.label)} {link.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default DashboardNav;
