import Head from 'next/head';

import React, { useEffect } from 'react';

import ListingListPreview from '../../components/ListingListPreview';
import UpcomingEventsIntro from '../../components/UpcomingEventsIntro';
import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { BookingSettings } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

interface Props {
  settings: BookingSettings;
}

const StayPage = ({ settings }: Props) => {
  const config = useConfig();
  const { PLATFORM_NAME } = config || {};
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
        <title>
          {__('listings_title')} {PLATFORM_NAME}
        </title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}

      <section className="text-center flex justify-center flex-wrap mb-12 ">
        <div className="md:max-w-5xl">
          <div className="mb-6 flex justify-between flex-col sm:flex-row gap-4">
            <Heading>
              {__('listings_title')}
              {PLATFORM_NAME}
            </Heading>
          </div>
          <div className="grid md:grid-cols-4 gap-x-12 md:gap-x-5 gap-y-16">
            {listings &&
              listings.count() > 0 &&
              isTeamMember &&
              user &&
              listings.map((listing: any) => {
                return (
                  <ListingListPreview
                    discounts={settings.discounts}
                    isAdminPage={false}
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
                    discounts={settings.discounts}
                    isAdminPage={false}
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

      <section className="text-center flex justify-center flex-wrap mb-12 ">
        <div className="md:max-w-5xl">
          <UpcomingEventsIntro />
        </div>
      </section>
    </>
  );
};

StayPage.getInitialProps = async () => {
  try {
    const {
      data: {
        results: { value: settings },
      },
    } = await api.get('/config/booking');

    return {
      settings: settings as BookingSettings,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default StayPage;