import Link from 'next/link';
import { useRouter } from 'next/router';

import { useTranslations } from 'next-intl';

import BookingsIcon from '../icons/BookingsIcon';
import HospitalityIcon from '../icons/HospitalityIcon';
import NavBookingsIcon from '../icons/NavBookingsIcon';
import UserListIcon from './UserListIcon';

const DashboardNav = () => {
  const t = useTranslations();
  const router = useRouter();
  const path = router.asPath;

  const DASHBOARD_LINKS = [
    {
      label: t('navigation_dashboard'),
      url: '/dashboard',
    },
    {
      label: t('navigation_bookings'),
      subsections: [
        {
          label: t('navigation_all_bookings'),
          url: '/bookings/all',
        },
        {
          label: t('navigation_booking_requests'),
          url: '/bookings/requests',
        },
        {
          label: t('navigation_current_bookings'),
          url: '/bookings/current',
        },
        {
          label: t('navigation_booking_calendar'),
          url: '/bookings/calendar',
        },
      ],
    },

    {
      label: t('navigation_edit_listings'),
      url: '/listings',
    },
    {
      label: t('navigation_user_list'),
      url: '/admin/manage-users',
    },
  ];

  const getIcon = (label: string) => {
    switch (label) {
      case t('navigation_dashboard'):
        return <BookingsIcon />;
      case t('navigation_bookings'):
        return <NavBookingsIcon />;
      case t('navigation_user_list'):
        return <UserListIcon />;
      case t('navigation_edit_listings'):
        return <HospitalityIcon color="black" />;
      default:
        return null;
    }
  };
  return (
    <nav className="hidden xl:block w-0 xl:w-[220px] flex-shrink-0 px-4">
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
                        path === link?.url ? 'bg-accent-light' : ''
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
