import Head from 'next/head';
import Link from 'next/link';

import { useEffect } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import ListingListPreview from '../../components/ListingListPreview';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { BookingConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  bookingConfig: BookingConfig;
}

const Listings = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const discounts = {
    daily: bookingConfig.discountsDaily,
    weekly: bookingConfig.discountsWeekly,
    monthly: bookingConfig.discountsMonthly,
  };

  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const isTeamMember = false;
  user?.roles.includes('space-host') ||
    user?.roles.includes('steward') ||
    user?.roles.includes('land-manager');

  const listingFilter = {
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  };

  const loadData = async () => {
    await Promise.all([platform.listing.get(listingFilter)]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const listings = platform.listing.find(listingFilter);

  const guestListings = listings?.filter((listing: any) => {
    return (
      listing.get('availableFor') !== 'team' &&
      listing.get('availableFor') !== 'volunteer'
    );
  });

  return (
    <>
      <Head>
        <title>{t('listings_edit_title')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        {listings?.get('error') && (
          <div className="validation-error">{listings.get('error')}</div>
        )}

        <section className="text-center flex flex-wrap mb-12 ">
          <div className="md:max-w-5xl">
            <div className="mb-6 flex justify-between flex-col sm:flex-row gap-4">
              <Heading>{t('listings_edit_title')}</Heading>
              {(user?.roles.includes('admin') ||
                user?.roles.includes('space-host')) && (
                <div className="user-actions">
                  <Link
                    as="/listings/create"
                    href="/listings/create"
                    className="btn-primary"
                  >
                    {t('listings_create')}
                  </Link>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-x-12 md:gap-x-5 gap-y-16">
              {listings &&
                listings.count() > 0 &&
                isTeamMember &&
                user &&
                listings.map((listing: any) => {
                  return (
                    <ListingListPreview
                      discounts={discounts}
                      isAdminPage={true}
                      key={listing.get('_id')}
                      listing={listing}
                    />
                  );
                })}
              {guestListings &&
                guestListings.count() > 0 &&
                (!isTeamMember || !user) &&
                guestListings.map((listing: any) => {
                  return (
                    <ListingListPreview
                      discounts={discounts}
                      isAdminPage={true}
                      key={listing.get('_id')}
                      listing={listing}
                    />
                  );
                })}

              {listings?.count() === 0 &&
                guestListings?.count() === 0 &&
                t('listing_no_listings_found')}
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

Listings.getInitialProps = async (context: NextPageContext) => {
  try {
    const [bookingRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const bookingConfig = bookingRes?.data?.results?.value;
    return {
      bookingConfig,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default Listings;
