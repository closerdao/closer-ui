import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';
import GuestMenu from './GuestMenu';
import Logo from './Logo';
import MemberMenu from './MemberMenu';
import Menu from './MenuContainer';
import ProfilePhoto from './ProfilePhoto';
import { Button } from './ui';

const Navigation = () => {
  const t = useTranslations();
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

        <div className="flex gap-2 w-auto justify-center items-center ">
          {APP_NAME && APP_NAME.toLowerCase() === 'earthbound' && (
            <div className="flex gap-3 items-center">
              <ul className="gap-4 hidden sm:flex">
                <li>
                  <Link href="/pages/invest">{t('header_nav_home')}</Link>
                </li>
                <li>
                  <Link href="/pages/invest">{t('header_nav_invest')}</Link>
                </li>
                <li>
                  <Link href="/stay">{t('header_nav_stay')}</Link>
                </li>
                <li>
                  <Link href="/members">{t('header_nav_community')}</Link>
                </li>
                <li>
                  <Link href="/events">{t('header_nav_events')}</Link>
                </li>
              </ul>
              <Button
                // onClick={() => router.push('/pages/join')}
                size="small"
                variant="primary"
                className={' bg-accent-alt border-accent-alt'}
              >
                <Link href='#how-to-join'>{t('header_nav_join_us')}</Link>
              </Button>
            </div>
          )}

          {router.locales?.length > 1 &&
          process.env.NEXT_PUBLIC_FEATURE_LOCALE_SWITCH === 'true' ? (
            <ul className="flex">
              {router.locales.map((locale) => {
                return (
                  <li
                    className="uppercase  border-r border-gray-200 last:border-r-0 px-1"
                    key={locale}
                  >
                    <Link
                      className={`${
                        router.locale === locale
                          ? 'text-gray-600 cursor-default'
                          : 'text-accent'
                      } font-accent`}
                      href={router.locale === locale ? '#' : router.asPath}
                      locale={locale}
                    >
                      {locale}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {!isAuthenticated &&
            APP_NAME &&
            (APP_NAME.toLowerCase() === 'moos' ||
              APP_NAME.toLowerCase() === 'lios' ||
              APP_NAME.toLowerCase() === 'foz') && (
              <Button
                onClick={() => router.push('/login')}
                size="small"
                variant="primary"
                className={`${
                  router?.locales?.length > 1 ? 'hidden sm:block' : ''
                }`}
              >
                {t('navigation_member_login')}
              </Button>
            )}
          {isAuthenticated &&
            APP_NAME &&
            (APP_NAME.toLowerCase() === 'moos' ||
              APP_NAME.toLowerCase() === 'foz' ||
              APP_NAME.toLowerCase() === 'per-auset') && (
              <Button
                onClick={() => router.push('/stay')}
                size="small"
                variant="primary"
                className={`${
                  router?.locales?.length > 1 ? 'hidden sm:block' : ''
                }`}
              >
                {t('navigation_stay')}
              </Button>
            )}
          {isAuthenticated && APP_NAME && APP_NAME.toLowerCase() === 'lios' && (
            <Button
              onClick={() => router.push('/learn/category/all')}
              size="small"
              variant="primary"
            >
              {t('navigation_see_courses')}
            </Button>
          )}

          {isBookingEnabled && APP_NAME && APP_NAME.toLowerCase() === 'tdf' && (
            <Button
              onClick={() => router.push('/stay')}
              size="small"
              variant="primary"
            >
              {t('navigation_stay')}
            </Button>
          )}

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
          <div className="ml-4 pr-4">
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
