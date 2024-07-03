import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import { NavigationLink } from '../types/nav';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import Profile from './Profile';
import ReportABug from './ReportABug';
import Wallet from './Wallet';
import NavLink from './ui/NavLink';
import Switcher from './ui/Switcher';

const filterLinks = (links: any[], option: string, roles: string[]) => {
  switch (option) {
    case 'Guest':
    case 'member':
      if (roles.includes('member')) {
        return links.filter((link: NavigationLink) => {
          const hasRole =
            link.enabled &&
            link.roles &&
            !['admin', 'member', 'steward', 'event-creator', 'space-host'].some(
              (role) => link?.roles?.includes(role),
            );

          return hasRole || (!link.roles && link.enabled);
        });
      } else {
        return links.filter((link: NavigationLink) => {
          const hasRole =
            link.enabled &&
            link.roles &&
            !['admin', 'member', 'steward', 'event-creator', 'space-host'].some(
              (role) => link?.roles?.includes(role),
            );

          return hasRole || (!link.roles && link.enabled);
        });
      }
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

const getLinks = (
  isBookingEnabled: boolean,
  areSubscriptionsEnabled: boolean,
  isVolunteeringEnabled: boolean,
  APP_NAME: string,
) => {
  const links = [
    {
      label: 'Subscriptions',
      url: '/subscriptions',
      enabled: areSubscriptionsEnabled,
    },
    {
      label: 'Events',
      url: '/events',
      enabled: true,
    },
    {
      label: 'Volunteer',
      url: '/volunteer',
      enabled: isVolunteeringEnabled,
    },
    {
      label: 'Booking requests',
      url: '/bookings/requests',
      enabled: isBookingEnabled,
      roles: ['space-host'],
    },
    {
      label: 'Current bookings',
      url: '/bookings/current',
      enabled: isBookingEnabled,
      roles: ['space-host'],
    },
    {
      label: 'All bookings',
      url: '/bookings/all',
      enabled: isBookingEnabled,
      roles: ['space-host'],
    },
    {
      label: 'Booking calendar',
      url: '/bookings/calendar',
      enabled: isBookingEnabled,
      roles: ['space-host'],
    },
    {
      label: 'Edit listings',
      url: '/listings',
      enabled: isBookingEnabled,
      roles: ['space-host'],
    },
    {
      label: __('navigation_stay', APP_NAME),
      url: '/stay',
      enabled: isBookingEnabled,
    },
    // {
    //   label: 'Invest',
    //   url: '/token',
    //   enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
    // },
    {
      label: 'My bookings',
      url: '/bookings',
      enabled: isBookingEnabled,
    },
    {
      label: 'Refer a friend',
      url: '/settings/referrals',
      enabled: process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true',
    },
    {
      label: 'Governance',
      url: 'https://snapshot.org/#/traditionaldreamfactory.eth',
      target: '_blank',
      enabled: true,
      roles: ['member'],
    },
    {
      label: 'User list',
      url: '/admin/manage-users',
      enabled: true,
      roles: ['admin'],
    },
    {
      label: 'New event',
      url: '/events/create',
      enabled: true,
      roles: ['event-creator'],
    },
    {
      label: 'New volunteer',
      url: '/volunteer/create',
      enabled: true,
      roles: ['steward'],
    },
    {
      label: 'Resources',
      url: '/resources',
      enabled: true,
    },
    {
      label: 'Support us',
      url: '/support-us',
      enabled: process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true',
    },
    {
      label: 'Learning hub',
      url: '/learn/category/all',
      enabled: process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true',
    },
    {
      label: 'Blog',
      url: '/blog',
      enabled: process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true',
    },
    {
      label: 'Platform settings',
      url: '/admin/config',
      enabled: true,
      roles: ['admin'],
    },
  ];
  return links;
};

const MemberMenu = () => {
  const { APP_NAME } = useConfig();
  const { user, logout } = useAuth();
  const [navOptions, setNavOptions] = useState(['guest']);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Guest');
  const [filteredLinks, setFilteredLinks] = useState<NavigationLink[]>();
  const [links, setLinks] = useState<any[]>([]);

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
          APP_NAME
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
      {filteredLinks &&
        filteredLinks.map((link: NavigationLink) => (
          <NavLink key={link.url} href={link.url} target={link.target}>
            {link.label}
          </NavLink>
        ))}
      <NavLink isButton={true} onClick={logout}>
        {__('navigation_sign_out')}
      </NavLink>
      <ReportABug />
    </nav>
  );
};

export default MemberMenu;
