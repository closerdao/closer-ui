import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';
import { getConfig, getConfigValueBySlug } from '../utils/configCache';
import ApiUrlWarning from './ApiUrlWarning';
import FundraisingWidget from './FundraisingWidget';
import GuestMenu from './GuestMenu';
import Logo from './Logo';
import MemberMenu from './MemberMenu';
import Menu from './MenuContainer';
import ProfilePhoto from './ProfilePhoto';
import { PromptGetInTouchContext } from './PromptGetInTouchContext';
import { Button } from './ui';

const Navigation = () => {
  const t = useTranslations();
  const config = useConfig() || {};
  const APP_NAME = config.APP_NAME;
  const configLoaded = config._configLoaded !== false;

  const { isAuthenticated, user } = useAuth();
  const isMember = user?.roles?.includes('member');

  const [navOpen, setNavOpen] = useState(false);
  const [isBookingEnabled, setIsBookingEnabled] = useState(false);
  const [isLearningHubEnabled, setIsLearningHubEnabled] = useState(false);
  const [isEventsEnabled, setIsEventsEnabled] = useState(false);
  const [isFundraiserEnabled, setIsFundraiserEnabled] = useState(false);
  const [fundraisingConfig, setFundraisingConfig] = useState(null);

  const generalConfig = config?.general ?? {};
  const primaryCtaVisitor = generalConfig.primaryCtaVisitor ?? 'login';
  const primaryCtaMember = generalConfig.primaryCtaMember ?? 'bookings';
  const primaryCtaCustomUrl = generalConfig.primaryCtaCustomUrl ?? '';
  const primaryCtaCustomText = generalConfig.primaryCtaCustomText ?? '';

  const { setIsOpen: setPromptGetInTouchOpen } = useContext(
    PromptGetInTouchContext,
  );

  useEffect(() => {
    (async () => {
      try {
        const configs = await getConfig(api);
        const bookingConfig = getConfigValueBySlug(configs, 'booking');
        const learningHubConfig = getConfigValueBySlug(configs, 'learningHub');
        const eventsConfig = getConfigValueBySlug(configs, 'events');
        if (bookingConfig?.enabled) setIsBookingEnabled(true);
        if (learningHubConfig?.enabled) setIsLearningHubEnabled(true);
        if (eventsConfig?.enabled) setIsEventsEnabled(true);
      } catch (err) {}
    })();
  }, []);

  useEffect(() => {
    if (
      APP_NAME?.toLowerCase() !== 'tdf' ||
      process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US !== 'true'
    ) {
      return;
    }
    (async () => {
      try {
        const configs = await getConfig(api);
        const config = getConfigValueBySlug(configs, 'fundraiser');
        if (config?.enabled) {
          setIsFundraiserEnabled(true);
          setFundraisingConfig(config);
        }
      } catch (err) {}
    })();
  }, [APP_NAME]);

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

  useEffect(() => {
    const updateActivity = async () => {
      try {
        if (isAuthenticated) {
          await api.post('/update-activity');
        }
      } catch (error) {
        // Silently fail - non-blocking
        console.debug('Activity update failed:', error);
      }
    };

    // Call immediately on mount
    updateActivity();

    // Set up interval for every 5 minutes
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="fixed top-0 left-0 right-0 z-20 flex flex-col">
      <ApiUrlWarning />
      <div className="NavContainer h-20 md:pt-0 bg-dominant shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <Logo />

          <div
            className={`${
              configLoaded && APP_NAME === 'closer'
                ? ' w-full justify-between'
                : 'w-auto justify-center'
            } flex gap-2  items-center`}
          >
            {configLoaded &&
              APP_NAME &&
              APP_NAME?.toLowerCase().includes('earthbound') && (
                <div className="flex gap-3 items-center">
                  <ul className="gap-4 hidden sm:flex">
                    <li>
                      <Link href="/">{t('header_nav_home')}</Link>
                    </li>
                    <li>
                      <Link href="/pages/invest">{t('header_nav_invest')}</Link>
                    </li>
                    <li>
                      <Link href="/pages/community">
                        {t('header_nav_community')}
                      </Link>
                    </li>
                    <li>
                      <Link href="/pages/events" className="whitespace-nowrap">
                        {t('header_nav_events')}
                      </Link>
                    </li>
                  </ul>
                  <Button
                    size="small"
                    variant="primary"
                    className={' bg-accent-alt border-accent-alt'}
                  >
                    <Link href="/#how-to-join">{t('header_nav_join_us')}</Link>
                  </Button>
                </div>
              )}
            {configLoaded &&
              APP_NAME &&
              APP_NAME?.toLowerCase() === 'closer' && (
                <div className="flex gap-3 items-center  w-full justify-between">
                  <div className="w-full flex justify-center">
                    <ul className="gap-4 text-sm md:text-md hidden md:flex font-medium">
                      <li>
                        <Link href="/#features">
                          {t('header_nav_features')}
                        </Link>
                      </li>
                      <li>
                        <Link href="/#communities">
                          {t('header_nav_communities')}
                        </Link>
                      </li>
                      <li>
                        <Link href="/#governance" className="whitespace-nowrap">
                          {t('header_nav_governance')}
                        </Link>
                      </li>
                      <li>
                        <Link href="/agent">{t('header_nav_agent')}</Link>
                      </li>
                      <li>
                        <Link href="/pricing">{t('header_nav_pricing')}</Link>
                      </li>
                      {process.env.NEXT_PUBLIC_FEATURE_ROLES === 'true' && (
                        <li>
                          <Link href="/roles">
                            {t('header_nav_work_with_us')}
                          </Link>
                        </li>
                      )}
                      <li>
                        <Link
                          href="https://closer.gitbook.io/documentation"
                          target="_blank"
                        >
                          {t('header_nav_docs')}
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => {
                      setPromptGetInTouchOpen(true);
                    }}
                    size="small"
                    variant="primary"
                    className={
                      'hidden sm:block w-fit  bg-accent text-background border-foreground'
                    }
                  >
                    {t('header_nav_schedule_a_demo')}
                  </Button>
                </div>
              )}

            {configLoaded &&
            router.locales?.length > 1 &&
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
                            ? 'text-accent cursor-default'
                            : 'text-gray-600 '
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
            {configLoaded &&
              APP_NAME &&
              !APP_NAME?.toLowerCase().includes('earthbound') &&
              APP_NAME?.toLowerCase() !== 'closer' &&
              (() => {
                const cta = isAuthenticated ? primaryCtaMember : primaryCtaVisitor;
                if (cta === 'none') return null;
                if (cta === 'bookings' && !isBookingEnabled) return null;
                if (cta === 'learningHub' && !isLearningHubEnabled) return null;
                if (cta === 'events' && !isEventsEnabled) return null;
                if (cta === 'custom' && !primaryCtaCustomUrl?.trim()) return null;
                const buttonClass =
                  router?.locales?.length > 1 ? 'hidden sm:block' : '';
                if (cta === 'login') {
                  return (
                    <Button
                      key="cta-login"
                      onClick={() => router.push('/login')}
                      size="small"
                      variant="primary"
                      className={buttonClass}
                    >
                      {t('navigation_member_login')}
                    </Button>
                  );
                }
                if (cta === 'bookings') {
                  const stayHref =
                    isAuthenticated &&
                    isMember &&
                    APP_NAME?.toLowerCase() === 'tdf'
                      ? '/bookings/create/dates'
                      : '/stay';
                  return (
                    <Button
                      key="cta-bookings"
                      onClick={() => router.push(stayHref)}
                      size="small"
                      variant="primary"
                      className={buttonClass}
                    >
                      {t('navigation_stay')}
                    </Button>
                  );
                }
                if (cta === 'learningHub') {
                  return (
                    <Button
                      key="cta-learningHub"
                      onClick={() => router.push('/learn/category/all')}
                      size="small"
                      variant="primary"
                      className={buttonClass}
                    >
                      {t('navigation_see_courses')}
                    </Button>
                  );
                }
                if (cta === 'events') {
                  return (
                    <Button
                      key="cta-events"
                      onClick={() => router.push('/events')}
                      size="small"
                      variant="primary"
                      className={buttonClass}
                    >
                      {t('navigation_see_events')}
                    </Button>
                  );
                }
                if (cta === 'custom') {
                  const href = primaryCtaCustomUrl.trim();
                  const text = primaryCtaCustomText?.trim() || t('navigation_stay');
                  return (
                    <Button
                      key="cta-custom"
                      onClick={() =>
                        href.startsWith('http')
                          ? window.open(href, '_blank')
                          : router.push(href)
                      }
                      size="small"
                      variant="primary"
                      className={buttonClass}
                    >
                      {text}
                    </Button>
                  );
                }
                return null;
              })()}
            {configLoaded && APP_NAME && APP_NAME?.toLowerCase() === 'tdf' && isFundraiserEnabled && (
              <div className="w-fit flex-shrink-0">
                <FundraisingWidget
                  variant="nav"
                  fundraisingConfig={fundraisingConfig}
                />
              </div>
            )}
            {configLoaded && isAuthenticated && (
              <Link
                href={`/members/${user?.slug}`}
                passHref
                title="View profile"
                className="hidden md:flex md:flex-row items-center z-0"
              >
                <ProfilePhoto user={user} size="10" />
              </Link>
            )}
            <div className="ml-4 pr-4 flex-shrink-0">
              <Menu isOpen={navOpen} toggleNav={toggleNav}>
                {configLoaded ? (
                  isAuthenticated ? (
                    <MemberMenu />
                  ) : (
                    <GuestMenu />
                  )
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                    <span className="animate-pulse">Loading…</span>
                  </div>
                )}
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
