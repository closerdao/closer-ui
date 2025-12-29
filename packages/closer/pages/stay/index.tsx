import Head from 'next/head';
import Link from 'next/link';

import { useEffect } from 'react';

import Hosts from '../../components/Hosts';
import ListingListPreview from '../../components/ListingListPreview';
import Reviews from '../../components/Reviews';
import UpcomingEventsIntro from '../../components/UpcomingEventsIntro';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  BookingRulesConfig,
  GeneralConfig,
  VolunteerConfig,
  VolunteerOpportunity,
} from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import {  LinkButton } from '../../components/ui';

interface Props {
  bookingSettings: any;
  bookingRules: BookingRulesConfig | null;
  generalConfig: GeneralConfig | null;
  opportunities: VolunteerOpportunity[] | null;
  volunteerConfig: VolunteerConfig;
  error: string | null;
}

const StayPage = ({
  bookingSettings,
  generalConfig,
  opportunities,
  volunteerConfig,
  error,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const config = useConfig();

  const discounts = {
    daily: bookingSettings?.discountsDaily,
    weekly: bookingSettings?.discountsWeekly,
    monthly: bookingSettings?.discountsMonthly,
  };
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { TEAM_EMAIL } = config || {};
  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const isBookingEnabled = bookingSettings?.enabled;

  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );
  const listingFilter = {
    where: {
      availableFor: {
        $in: ['guests', isTeamMember ? 'team' : null].filter((e) => e),
      },
    },
    ...(APP_NAME === 'lios' ? { sort_by: 'created' } : {}),

    limit: MAX_LISTINGS_TO_FETCH,
  };
  const hostsFilter = {
    where: {
      roles: { $in: ['space-host', 'steward', 'team'].filter((e) => e) },
      email: { $ne: process.env.NEXT_PUBLIC_DEBUG_EMAIL },
    },
  };

  const loadData = async () => {
    await Promise.all([
      platform.listing.get(listingFilter),
      platform.user.get(hostsFilter),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [isTeamMember]);

  useEffect(() => {
    api.post('/metric', {
      event: 'page-view',
      value: 'stay',
      point: 0,
      category: 'engagement',
    });
  }, []);

  const listings = platform.listing.find(listingFilter);

  const hosts = platform.user.find(hostsFilter);

  console.log('hosts=', hosts?.toJS());
  const guestListings = listings?.filter((listing: any) => {
    return (
      listing.get('availableFor') !== 'team' &&
      listing.get('availableFor') !== 'volunteer'
    );
  });

  if (!bookingSettings || error) {
    return <PageNotFound error="Network error" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('stay_title')} ${PLATFORM_NAME}`}</title>
        <meta name="description" content={t('stay_meta_description') || `Book your stay at ${PLATFORM_NAME}. Discover unique accommodations in regenerative communities.`} />
        <meta name="keywords" content={`${PLATFORM_NAME}, accommodations, booking, stay, regenerative communities, ecovillage, intentional community, sustainable travel`} />
        <meta property="og:title" content={`${t('stay_title')} ${PLATFORM_NAME}`} />
        <meta property="og:description" content={t('stay_meta_description') || `Book your stay at ${PLATFORM_NAME}. Discover unique accommodations in regenerative communities.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/stay`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${t('stay_title')} ${PLATFORM_NAME}`} />
        <meta name="twitter:description" content={t('stay_meta_description') || `Book your stay at ${PLATFORM_NAME}.`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/stay`} />
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}

      {APP_NAME?.toLowerCase() === 'tdf' ? (
        <>
          <section className="bg-gradient-to-br from-accent-light to-accent-alt-light min-h-[50vh] flex items-center">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="text-center">
                <Heading
                  className="text-4xl md:text-6xl mb-6"
                  display
                  level={1}
                >
                  {t('stay_hero_title')}
                </Heading>
                <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed mb-12">
                  {t('stay_hero_subtitle')}
                </p>
                {isBookingEnabled && (
                  <Link
                    href="/bookings/create/dates"
                    className="btn btn-primary text-xl px-8 py-3 inline-block"
                  >
                    {user?.roles.includes('member')
                      ? t('buttons_book_now')
                      : t('buttons_apply_to_stay')}
                  </Link>
                )}
              </div>
            </div>
          </section>

          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <Heading level={2} className="mb-6 text-3xl">
                  {t('stay_story_title')}
                </Heading>
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                  {t('stay_story_desc')}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="text-4xl font-semibold text-gray-900 mb-2">14</div>
                  <div className="text-sm text-gray-600 mb-4">{t('stay_feature_suites_label')}</div>
                  <p className="text-gray-700 text-sm">
                    {t('stay_feature_suites_desc')}
                  </p>
                </div>
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="text-4xl font-semibold text-gray-900 mb-2">{t('stay_feature_building_status')}</div>
                  <div className="text-sm text-gray-600 mb-4">{t('stay_feature_building_label')}</div>
                  <p className="text-gray-700 text-sm">
                    {t('stay_feature_building_desc')}
                  </p>
                </div>
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="text-4xl font-semibold text-gray-900 mb-2">{t('stay_feature_community_status')}</div>
                  <div className="text-sm text-gray-600 mb-4">{t('stay_feature_community_label')}</div>
                  <p className="text-gray-700 text-sm">
                    {t('stay_feature_community_desc')}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section
          className={`max-w-6xl mx-auto mb-16  ${
            PLATFORM_NAME.toLowerCase().includes('earthbound')
              ? 'flex justify-center'
              : ''
          }`}
        >
          <div className="mb-6 max-w-prose ">
            <Heading
              level={1}
              className={`${
                APP_NAME === 'lios' ? 'text-xl sm:text-2xl' : 'text-4xl'
              }  pb-2 mt-8`}
            >
              <p
                className="font-accent"
                dangerouslySetInnerHTML={{ __html: t.raw('stay_title') }}
              />
            </Heading>

            {PLATFORM_NAME.toLowerCase().includes('earthbound') && (
              <LinkButton
                href="https://us2.cloudbeds.com/en/reservation/C3o5ZJ?currency=sek"
                target="_blank"
                size="small"
                variant="primary"
                className={' bg-accent-alt border-accent-alt w-fit my-4'}
              >
                BOOK A STAY
              </LinkButton>
            )}

            <div className="rich-text font-accent">
              {t.rich('stay_description', {
                p: (chunks) => (
                  <p className="mb-4 text-base leading-relaxed">{chunks}</p>
                ),
                link: (chunks) => (
                  <a
                    href="https://grimsnas.se/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    {chunks}
                  </a>
                ),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </div>
        </section>
      )}

      {APP_NAME?.toLowerCase() !== 'tdf' && (
        <section className="max-w-6xl mx-auto mb-16 flex align-center">
          {isBookingEnabled && (
            <Link
              href="/bookings/create/dates"
              className="btn btn-primary text-xl px-8 py-3"
            >
              {user?.roles.includes('member')
                ? t('buttons_book_now')
                : t('buttons_apply_to_stay')}
            </Link>
          )}
          {process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING &&
            opportunities &&
            opportunities?.length > 0 &&
            volunteerConfig.enabled === true && (
              <Link
                href="/volunteer"
                className="text-xl px-8 py-3 text-accent italic underline"
              >
                {t('buttons_volunteer')}
              </Link>
            )}
        </section>
      )}

      <section className="max-w-6xl mx-auto mb-16">
        <div className={` w-full ${PLATFORM_NAME.toLowerCase().includes('earthbound') ? 'flex justify-center' : ''}`}>
          <Hosts hosts={hosts} email={TEAM_EMAIL} />
        </div>

        <div className="mb-6">
          {listings && listings.count() > 0 && (
            <div>
              <Heading level={2} className="text-2xl mb-2 max-w-prose">
                {t('stay_chose_accommodation')}
              </Heading>
              
              <p className="mb-8 max-w-prose">
                {APP_NAME &&
                  !t('stay_chose_accommodation_description').includes(
                    'missing',
                  ) &&
                  t('stay_chose_accommodation_description')}
              </p>
              <div className="grid md:grid-cols-4 gap-x-12 md:gap-x-5 gap-y-16">
                {listings.map((listing: any) => {
                  return (
                    <ListingListPreview
                      discounts={discounts}
                      isAdminPage={false}
                      key={listing.get('_id')}
                      listing={listing}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {/* {listings?.count() === 0 &&
            guestListings?.count() === 0 &&
            t('listing_no_listings_found')} */}
        </div>

        {/* TODO some time: move reviews to configs */}
        {APP_NAME?.toLowerCase() === 'tdf' && <Reviews />}
      </section>

      {APP_NAME?.toLowerCase() !== 'earthbound' && (
        <section className="max-w-6xl mx-auto mb-12">
          <div className="md:max-w-5xl">
            <UpcomingEventsIntro />
          </div>
        </section>
      )}
    </>
  );
};

StayPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [
      bookingResponse,
      bookingRulesResponse,
      generalRes,
      volunteerRes,
      volunteerConfigRes,
      messages,
    ] = await Promise.all([
      api.get('/config/booking').catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/booking-rules').catch((err) => {
        console.error('Error fetching booking rules:', err);
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/volunteer').catch(() => {
        return null;
      }),
      api.get('/config/volunteering').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    const bookingSettings = bookingResponse?.data?.results?.value;
    const bookingRules = bookingRulesResponse?.data?.results?.value;
    const opportunities = volunteerRes?.data?.results;
    const volunteerConfig = volunteerConfigRes?.data?.results?.value;

    return {
      bookingSettings,
      bookingRules,
      generalConfig,
      messages,
      opportunities,
      volunteerConfig,
      error: null,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      bookingRules: null,
      generalConfig: null,
      messages: null,
      opportunities: null,
      volunteerConfig: null,
    };
  }
};

export default StayPage;
