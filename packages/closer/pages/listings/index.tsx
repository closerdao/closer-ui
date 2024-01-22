import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import ListingListPreview from '../../components/ListingListPreview';
import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

interface Props {
  settings: any;
}

const Listings = ({ settings }: Props) => {
  const discounts = {
    daily: settings.discountsDaily,
    weekly: settings.discountsWeekly,
    monthly: settings.discountsMonthly,
  };

  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isTeamMember = false;
  user?.roles.includes('space-host') ||
    user?.roles.includes('steward') ||
    user?.roles.includes('land-manager');

  const loadData = async () => {
    await Promise.all([platform.listing.get()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const listings = platform.listing.find();
  const guestListings = listings?.filter((listing: any) => {
    return (
      listing.get('availableFor') !== 'team' &&
      listing.get('availableFor') !== 'volunteer'
    );
  });

  return (
    <>
      <Head>
        <title>{__('listings_edit_title')}</title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}

      <section className="text-center flex justify-center flex-wrap mb-12 ">
        <div className="md:max-w-5xl">
          <div className="mb-6 flex justify-between flex-col sm:flex-row gap-4">
            <Heading>{__('listings_edit_title')}</Heading>
            {(user?.roles.includes('admin') ||
              user?.roles.includes('space-host')) && (
              <div className="user-actions">
                <Link
                  as="/listings/create"
                  href="/listings/create"
                  className="btn-primary"
                >
                  {__('listings_create')}
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
              __('listing_no_listings_found')}
          </div>
        </div>
      </section>
    </>
  );
};

Listings.getInitialProps = async () => {
  try {
    const {
      data: {
        results: { value: settings },
      },
    } = await api.get('/config/booking');

    return {
      settings: settings as any,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default Listings;
