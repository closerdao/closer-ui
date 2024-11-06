import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

// import { useTranslations } from 'next-intl';
import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import { NavigationLink } from '../types/nav';
import api from '../utils/api';
import Profile from './Profile';
import ReportABug from './ReportABug';
import Wallet from './Wallet';
import NavLink from './ui/NavLink';
import Switcher from './ui/Switcher';

const filterLinks = (links: any[], option: string, roles: string[]) => {
  switch (option) {
    case 'Guest':
    case 'member':
      return links.filter((link: NavigationLink) => {
        const hasRole =
          link.enabled &&
          link.roles &&
          !['admin', 'member', 'steward', 'event-creator', 'space-host'].some(
            (role) => link?.roles?.includes(role),
          );

        return hasRole || (!link.roles && link.enabled);
      });

    case 'Admin':
      return links.filter((link: NavigationLink) => {
        if (link.roles) {
          return (
            roles.includes(link.roles[0]) &&
            link.roles[0] !== 'member' &&
            link.enabled
          );
        }
      });
  }
};

const MemberMenu = () => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  const { user, logout } = useAuth();
  const [navOptions, setNavOptions] = useState(['guest']);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Guest');
  const [filteredLinks, setFilteredLinks] = useState<NavigationLink[]>();
  const [links, setLinks] = useState<any[]>([]);

  const getLinks = (
    isBookingEnabled: boolean,
    areSubscriptionsEnabled: boolean,
    isVolunteeringEnabled: boolean,
  ) => {
    const links = [
      {
        label: t('navigation_subscriptions'),
        url: '/subscriptions',
        enabled: areSubscriptionsEnabled,
      },
      {
        label: t('navigation_events'),
        url: '/events',
        enabled: true,
      },
      {
        label: t('navigation_volunteer'),
        url: '/volunteer',
        enabled: isVolunteeringEnabled,
      },
      {
        label: t('navigation_dashboard'),
        url: '/dashboard',
        enabled: isBookingEnabled,
        roles: ['admin'],
      },
      {
        label: t('navigation_booking_requests'),
        url: '/bookings/requests',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: t('navigation_current_bookings'),
        url: '/bookings/current',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: t('navigation_all_bookings'),
        url: '/bookings/all',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: t('navigation_booking_calendar'),
        url: '/bookings/calendar',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: t('navigation_edit_listings'),
        url: '/listings',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: 'Edit food',
        url: '/food',
        enabled: isBookingEnabled,
        roles: ['space-host'],
      },
      {
        label: t('navigation_stay'),
        url: '/stay',
        enabled: isBookingEnabled,
      },
      // {
      //   label: t('navigation_invest'),
      //   url: '/token',
      //   enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
      // },
      {
        label: t('navigation_my_bookings'),
        url: '/bookings',
        enabled: isBookingEnabled,
      },
      {
        label: t('navigation_refer_a_friend'),
        url: '/settings/referrals',
        enabled: process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true',
      },
      {
        label: t('navigation_governance'),
        url: 'https://snapshot.org/#/traditionaldreamfactory.eth',
        target: '_blank',
        enabled: true,
        roles: ['member'],
      },
      {
        label: t('navigation_user_list'),
        url: '/admin/manage-users',
        enabled: true,
        roles: ['admin'],
      },
      {
        label: t('navigation_new_event'),
        url: '/events/create',
        enabled: true,
        roles: ['event-creator'],
      },
      {
        label: t('navigation_new_volunteer'),
        url: '/volunteer/create',
        enabled: true,
        roles: ['steward'],
      },
      ...(APP_NAME !== 'foz' ? [{
        label: t('navigation_resources'),
        url: '/resources',
        enabled: true,
      }] : []),
      {
        label: t('navigation_support_us'),
        url: '/support-us',
        enabled: process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true',
      },
      {
        label: t('navigation_learning_hub'),
        url: '/learn/category/all',
        enabled: process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true',
      },
      {
        label: t('navigation_buy_token'),
        url: '/token',
        enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
      },
      {
        label: t('navigation_blog'),
        url: '/blog',
        enabled: process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true',
      },
      {
        label: t('navigation_platform_settings'),
        url: '/admin/config',
        enabled: true,
        roles: ['admin'],
      },
    ];
    return links;
  };

  useEffect(() => {
    (async () => {
      try {
        const [bookingRes, subscriptionsRes, volunteerRes] = await Promise.all([
          api.get('config/booking').catch((err) => {
            console.error('Error fetching booking config:', err);
            return null;
          }),
          api.get('config/subscriptions').catch((err) => {
            console.error('Error fetching subscriptions config:', err);
            return null;
          }),
          api.get('config/volunteering').catch((err) => {
            console.error('Error fetching booking config:', err);
            return null;
          }),
        ]);

        const areSubscriptionsEnabled =
          subscriptionsRes &&
          subscriptionsRes?.data.results.value.enabled &&
          process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
        const isBookingEnabled =
          bookingRes &&
          bookingRes?.data.results.value.enabled &&
          process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

        const isVolunteeringEnabled =
          volunteerRes?.data.results.value.enabled === true &&
          process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true';

        const updatedLinks = getLinks(
          isBookingEnabled,
          areSubscriptionsEnabled,
          isVolunteeringEnabled,
        );

        setLinks(updatedLinks);
        setFilteredLinks(
          filterLinks(updatedLinks, selectedSwitcherOption, user?.roles || []),
        );
      } catch (err) {
        console.log('error');
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      if (
        user.roles.includes('admin') ||
        user.roles.includes('space-host') ||
        user.roles.includes('steward') ||
        user.roles.includes('event-creator')
      ) {
        setNavOptions(['Guest', 'Admin']);
      } else {
        if (!user.roles.includes('member')) {
          setNavOptions(['guest']);
          setSelectedSwitcherOption('Guest');
        }
        if (user.roles.includes('member')) {
          setNavOptions(['guest']);
          setSelectedSwitcherOption('member');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    setFilteredLinks(
      filterLinks(links, selectedSwitcherOption, user?.roles || []),
    );
  }, [selectedSwitcherOption]);

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  return (
    <nav className="flex flex-col gap-4 ">
      <Profile isDemo={false} />
      {isWalletEnabled && <Wallet />}
      {navOptions.length > 1 && (
        <div className="mb-8 mt-4">
          <Switcher
            options={navOptions}
            selectedOption={selectedSwitcherOption}
            setSelectedOption={setSelectedSwitcherOption}
          />
        </div>
      )}
      {filteredLinks?.map((link: NavigationLink) => (
        <NavLink key={link.url} href={link.url} target={link.target}>
          {link.label}
        </NavLink>
      ))}
      <NavLink isButton={true} onClick={logout}>
        {t('navigation_sign_out')}
      </NavLink>
      <ReportABug />
    </nav>
  );
};

export default MemberMenu;
