import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import ListingListPreview from '../../components/ListingListPreview';
import UserPreview from '../../components/UserPreview';
import UpcomingEventsIntro from '../../components/UpcomingEventsIntro';
import PhotoGallery from '../../components/PhotoGallery';
import Reviews from '../../components/Reviews';
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
  const { PLATFORM_NAME, TEAM_EMAIL } = config || {};
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isTeamMember = user?.roles.some(roles => ['space-host', 'steward', 'land-manager', 'team'].includes(roles));
  const listingFilter = { where: { availableFor: { $in: ['guests', isTeamMember ? 'team' : null].filter(e => e) } } };
  const hostsFilter = { where: { roles: { $in: ['space-host', 'steward', 'team'].filter(e => e) } } };

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
          <Heading level={1} className="text-4xl pb-2 mt-8">
            {__('stay_title')}
            {PLATFORM_NAME}
          </Heading>
          <p>{__('stay_description')}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mb-16">
        <PhotoGallery />
      </section>
      
      <section className="max-w-6xl mx-auto mb-16">
        <div className="mb-6">
          <Heading level={2} className="text-2xl pb-2 mt-8">
            {__('stay_what_to_expect_title')}
          </Heading>
          <ul>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_1')}
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_2')}
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_3')}
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_4')}
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_5')}
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              {__('stay_what_to_expect_6')}
            </li>
          </ul>
        </div>
      </section>
      <section className="max-w-6xl mx-auto mb-16">
        <div className="mb-6">
          <div className="max-w-prose">
            <Heading level={2} className="text-2xl pb-2 mt-8">
              {__('stay_meet_your_hosts')}
            </Heading>
            <p className="mb-2">
              {__('stay_meet_your_hosts_description')}
            </p>
          </div>
          { hosts && hosts.count() > 0 && (
            <div className="grid md:grid-cols-3 gap-x-4 gap-y-4">
              {hosts.map((host: any) => {
                return (
                  <UserPreview
                    key={host.get('_id')}
                    user={host}
                  />
                );
              })}
            </div>
          )}
          <Link href={`mailto:${TEAM_EMAIL}`} className="btn my-4">
            {__('stay_meet_your_hosts_link')}
          </Link>
        </div>
        <div className="mb-6">
          <Heading level={2} className="text-2xl mb-2 max-w-prose">
            {__('stay_chose_accomodation')}
          </Heading>
          <p className="mb-2 max-w-prose">
            {__('stay_chose_accomodation_description')}
          </p>
          {listings &&
            listings.count() > 0 &&
            <div className="grid md:grid-cols-4 gap-x-12 md:gap-x-5 gap-y-16">
              {listings.map((listing: any) => {
                return (
                  <ListingListPreview
                    discounts={settings.discounts}
                    isAdminPage={false}
                    key={listing.get('_id')}
                    listing={listing}
                  />
                );
              })}
            </div>
          }
          {listings?.count() === 0 &&
            guestListings?.count() === 0 &&
            __('listing_no_listings_found')}
        </div>
        
        <Reviews />
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
