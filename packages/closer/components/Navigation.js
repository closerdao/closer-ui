import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import GuestMenu from './GuestMenu';
import Logo from './Logo';
import MemberMenu from './MemberMenu';
import Menu from './MenuContainer';
import ProfilePhoto from './ProfilePhoto';
import { Button } from './ui';

const Navigation = () => {
  const { APP_NAME } = useConfig() || {};
  const { isAuthenticated, user } = useAuth();

  const [navOpen, setNavOpen] = useState(false);
  const [isBookingEnabled, setIsBookingEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const bookingConfigRes = await api.get('config/booking').catch(() => {
          return;
        });
        if (bookingConfigRes?.data.results.value.enabled) {
          setIsBookingEnabled(true);
        }
      } catch (err) {
        return;
      }
    })();
  }, []);

  const toggleNav = () => {
    setNavOpen((isOpen) => !isOpen);
  };

  const closeNav = () => {
    setNavOpen(false);
  };

  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', closeNav);
    router.events.on('routeChangeError', closeNav);

    return () => {
      router.events.off('routeChangeComplete', closeNav);
      router.events.off('routeChangeError', closeNav);
    };
  }, [router]);

  return (
    <div className="NavContainer h-20 md:pt-0 top-0 left-0 right-0 fixed z-20 bg-background shadow">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <Logo />
        <div className="flex gap-3 w-auto justify-center items-center ">
          {!isAuthenticated &&
            APP_NAME &&
            (APP_NAME.toLowerCase() === 'moos' ||
              APP_NAME.toLowerCase() === 'lios') && (
              <Button
                onClick={() => router.push('/login')}
                size="small"
                type="primary"
              >
                {APP_NAME && __('navigation_member_login', APP_NAME)}
              </Button>
            )}
          {isAuthenticated &&
            APP_NAME &&
            (APP_NAME.toLowerCase() === 'moos' ||
              APP_NAME.toLowerCase() === 'lios') && (
              <Button
                onClick={() => router.push('/stay')}
                size="small"
                type="primary"
              >
                {APP_NAME && __('navigation_stay', APP_NAME)}
              </Button>
            )}

          {isBookingEnabled && APP_NAME && APP_NAME.toLowerCase() === 'tdf' && (
            <Button
              onClick={() => router.push('/stay')}
              size="small"
              type="primary"
            >
              {APP_NAME && __('navigation_stay', APP_NAME)}
            </Button>
          )}

          {/* {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' && (
            <Link href="/token" className="uppercase">
              {__('navigation_buy_token')}
            </Link>
          )} */}

          {isAuthenticated && (
            <Link
              href={`/members/${user?.slug}`}
              passHref
              title="View profile"
              className="hidden md:flex md:flex-row items-center z-0"
            >
              <ProfilePhoto user={user} size="10" />
            </Link>
          )}
          <div className="ml-4">
            <Menu isOpen={navOpen} toggleNav={toggleNav}>
              {isAuthenticated ? <MemberMenu /> : <GuestMenu />}
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
