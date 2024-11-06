import Head from 'next/head';
import Link from 'next/link';

import { useEffect } from 'react';

import BookingRules from '../../components/BookingRules';
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

const ADMIN_EMAIL = 'vashnev@gmail.com';

interface Props {
  bookingSettings: any;
  bookingRules: BookingRulesConfig | null;
  generalConfig: GeneralConfig | null;
  opportunities: VolunteerOpportunity[] | null;
  volunteerConfig: VolunteerConfig;
}

const StayPage = ({
  bookingSettings,
  bookingRules,
  generalConfig,
  opportunities,
  volunteerConfig,
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
      email: { $ne: ADMIN_EMAIL },
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

  const listings = platform.listing.find(listingFilter);

  const hosts = platform.user.find(hostsFilter);
  const guestListings = listings?.filter((listing: any) => {
    return (
      listing.get('availableFor') !== 'team' &&
      listing.get('availableFor') !== 'volunteer'
    );
  });

  if (!bookingSettings) {
    return <PageNotFound error="Booking is disabled" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('stay_title')} ${PLATFORM_NAME}`}</title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}

      <section className="max-w-6xl mx-auto mb-16">
        <div className="mb-6 max-w-prose">
          <Heading level={1} className={`${APP_NAME === 'lios' ? 'text-xl sm:text-2xl': 'text-4xl'}  pb-2 mt-8`}>
            <p className='font-accent' dangerouslySetInnerHTML={{ __html: 
              t.raw('stay_title')
            }} />
                        
            {`
            ${APP_NAME && APP_NAME === 'tdf' ? PLATFORM_NAME : ''}`}
          </Heading>

          <div className='rich-text font-accent' dangerouslySetInnerHTML={{ __html: 
              t.raw('stay_description')
            }} />
     
        </div>
      </section>

      {bookingRules?.enabled && bookingRules?.elements[0].title && (
        <BookingRules rules={bookingRules?.elements} />
      )}

      <section className="max-w-6xl mx-auto mb-16 flex align-center">
        <Link
          href="/bookings/create/dates"
          className="btn btn-primary text-xl px-8 py-3"
        >
          {user?.roles.includes('member')
            ? t('buttons_book_now')
            : t('buttons_apply_to_stay')}
        </Link>
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

      <section className="max-w-6xl mx-auto mb-16">
        <Hosts hosts={hosts} email={TEAM_EMAIL} />

        <div className="mb-6">
          <Heading level={2} className="text-2xl mb-2 max-w-prose">
            {t('stay_chose_accommodation')}
          </Heading>
          <p className="mb-8 max-w-prose">
            {APP_NAME &&
              !t('stay_chose_accommodation_description').includes('missing') &&
              t('stay_chose_accommodation_description')}
          </p>
          {listings && listings.count() > 0 && (
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
          )}
          {listings?.count() === 0 &&
            guestListings?.count() === 0 &&
            t('listing_no_listings_found')}
        </div>

        {/* TODO some time: move reviews to configs */}
        {APP_NAME?.toLowerCase() === 'tdf' && <Reviews />}
      </section>

      <section className="max-w-6xl mx-auto mb-12">
        <div className="md:max-w-5xl">
          <UpcomingEventsIntro />
        </div>
      </section>
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
      messages
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
