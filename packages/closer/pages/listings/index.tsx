import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import ListingListPreview from '../../components/ListingListPreview';
import UpcomingEventsIntro from '../../components/UpcomingEventsIntro';
import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const Listings = () => {
  const config = useConfig();
  const { PLATFORM_NAME, APP_NAME } = config || {};
  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const loadData = async () => {
    await Promise.all([platform.listing.get()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const listings = platform.listing.find();

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
          <div className="grid md:grid-cols-4 gap-12 md:gap-5">
            {listings && listings.count() > 0
              ? listings.map((listing: any) => (
                  <ListingListPreview
                    key={listing.get('_id')}
                    listing={listing}
                  />
                ))
              : 'No Listings'}
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

export default Listings;
