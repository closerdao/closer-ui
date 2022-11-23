import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect } from 'react';

import Layout from '../../components/Layout';
import ListingListPreview from '../../components/ListingListPreview';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { __ } from '../../utils/helpers';

const Listings = () => {
  const router = useRouter();

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
    <Layout>
      <Head>
        <title>{__('listings_title')}</title>
      </Head>
      {listings && listings.get('error') && (
        <div className="validation-error">{listings.get('error')}</div>
      )}
      <div className="main-content intro fullwidth">
        <div className="page-header mb-3 flex justify-between">
          <h1>{__('listings_title')}</h1>
          <div className="user-actions">
            <Link as="/listings/create" href="/listings/create">
              <a className="btn-primary">{__('listings_create')}</a>
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
    </Layout>
  );
};

export default Listings;
