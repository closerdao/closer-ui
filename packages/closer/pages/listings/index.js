import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import ListingListPreview from '../../components/ListingListPreview';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { __ } from '../../utils/helpers';

const Listings = () => {
  const { user } = useAuth();
  const { platform } = usePlatform();

  const loadData = async () => {
    await Promise.all([platform.listing.get()]);
  };

  useEffect(() => {
    if (user && user.roles.includes('space-host')) {
      loadData();
    }
  }, [user]);

  if (!user || !user.roles.includes('space-host')) {
    return (
      <PageNotAllowed error="Only space-host role may access this page." />
    );
  }

  const listings = platform.listing.find();

  return (
    <>
      <Head>
        <title>{__('listings_title')}</title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}
      <div className="main-content w-full">
        <div className="page-header mb-6 flex justify-between">
          <h1>{__('listings_title')}</h1>
          <div className="user-actions">
            <Link
              as="/listings/create"
              href="/listings/create"
              className="btn-primary"
            >
              {__('listings_create')}
            </Link>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {listings && listings.count() > 0
            ? listings.map((listing) => (
                <ListingListPreview
                  key={listing.get('_id')}
                  listing={listing}
                />
              ))
            : 'No Listings'}
        </div>
      </div>
    </>
  );
};

export default Listings;