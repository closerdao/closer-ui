import Head from 'next/head';
import Link from 'next/link';

import { useEffect } from 'react';

import BookingRules from '../../components/BookingRules';
import Hosts from '../../components/Hosts';
import ListingListPreview from '../../components/ListingListPreview';
import Reviews from '../../components/Reviews';
import UpcomingEventsIntro from '../../components/UpcomingEventsIntro';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { BookingRulesConfig, GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

interface Props {
  bookingSettings: any;
  bookingRules: BookingRulesConfig | null;
  generalConfig: GeneralConfig | null;
}

const StayPage = ({ bookingSettings, bookingRules, generalConfig }: Props) => {
  const { APP_NAME } = useConfig();
  const config = useConfig();

  const appName = APP_NAME.toLowerCase();

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
  };
  const hostsFilter = {
    where: {
      roles: { $in: ['space-host', 'steward', 'team'].filter((e) => e) },
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
        <title>{`${__('stay_title')} ${PLATFORM_NAME}`}</title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}

      <section className="max-w-6xl mx-auto mb-16">
        <div className="mb-6 max-w-prose">
          <Heading level={1} className="text-4xl pb-2 mt-8 mb-4">
            {__('stay_title', appName)} {APP_NAME !== 'lios' && PLATFORM_NAME}
          </Heading>
          {!__('stay_description', appName).includes('_missing') && (
            <p>{__('stay_description', appName)}</p>
          )}
        </div>
      </section>

      {bookingRules?.enabled && bookingRules?.elements.length > 1 && (
        <BookingRules rules={bookingRules?.elements} />
      )}

      <section className="max-w-6xl mx-auto mb-16 flex align-center">
        <Link
          href="/bookings/create/dates"
          className="btn btn-primary text-xl px-8 py-3"
        >
          {user?.roles.includes('member')
            ? __('buttons_book_now')
            : __('buttons_apply_to_stay')}
        </Link>
        {process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING && (
          <Link
            href="/volunteer"
            className="text-xl px-8 py-3 text-accent italic underline"
          >
            {__('buttons_volunteer')}
          </Link>
        )}
      </section>

      <section className="max-w-6xl mx-auto mb-16">
        <Hosts hosts={hosts} email={TEAM_EMAIL} />

        <div className="mb-6">
          <Heading level={2} className="text-2xl mb-8 max-w-prose">
            {__('stay_chose_accommodation', appName)}
          </Heading>
          {!__('stay_chose_accommodation_description', appName).includes(
            '_missing',
          ) && (
            <p className="mb-8 max-w-prose">
              {__('stay_chose_accommodation_description', appName)}
            </p>
          )}

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
            __('listing_no_listings_found')}
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

StayPage.getInitialProps = async () => {
  try {
    const [bookingResponse, bookingRulesResponse, generalRes] =
      await Promise.all([
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
      ]);
    const generalConfig = generalRes?.data?.results?.value;

    const bookingSettings = bookingResponse?.data?.results?.value;
    const bookingRules = bookingRulesResponse?.data?.results?.value;

    return {
      bookingSettings,
      bookingRules,
      generalConfig,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      bookingRules: null,
      generalConfig: null,
    };
  }
};

export default StayPage;
