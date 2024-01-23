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
          {/* <Heading level={2} className="text-2xl pb-2 mt-8">
            {__('stay_what_to_expect_title')}
          </Heading>
          <ul className="mb-6">
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
          </ul> */}

          {/* TODO - this needs to be pulled from Config once its merged! */}
          <Heading display>
            Principles
          </Heading>
          <ul className="mb-4 max-w-prose">
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Radical Inclusion:</b> Anyone may be a part of TDF. We welcome the diversity of individuals. Anyone believing in our common dream may join.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Leave a positive trace:</b> We are a regenerative playground. So far we’ve planted over 3000 trees and shrubs, with 60+ species. Come and leave a mark that future generations will appreciate.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Consent:</b> Bring awareness to your boundaries and needs and respect those of others. If it’s not a fuck yes it’s a no.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Gifting:</b> This is a radical experiment in gifting economy. Except for food and laundry services at center camp, there will be no monetary transactions in the space. Ask yourself - what is your deepest gift that you can share?
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Radical Self-expression:</b> We have a cabinet of transformation where you can dress up - but please bring some funky outfits
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>De-commodification:</b> In order to preserve the spirit of gifting, our community seeks to create social environments that are unmediated by commercial sponsorships, transactions, or advertising. We stand ready to protect our culture from such exploitation. We resist the substitution of consumption for participatory experience.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Radical Self-reliance:</b> When you come to TDF, you are responsible for your own survival, safety, comfort, and well-being. There is food and drinks available at the center camp.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Communal Effort:</b> Our community values creative cooperation and collaboration. We strive to produce, promote and protect social networks, public spaces, works of art, and methods of communication that support such interaction.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Civic Responsibility:</b> TDF is nested within the village of Abela. You are invited to meet our neighbours, and please be respectful and aware that their needs may be different to yours.
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              <b>Participation:</b> We believe that transformative change, whether in the individual or in society, can occur only through the medium of deeply personal participation. We achieve being through doing. Everyone is invited to work. All participants are asked a very simple rule. Show up for our standup at 9am, and gift <b>4 hours of your time</b> to the common creation.
            </li>
          </ul>
          <div>
            <Link
              href="/bookings/create/dates"
              className="btn btn-primary text-xl px-8 py-3"
            >
              {__('buttons_apply_to_stay')}
            </Link>
          </div>
          <p className="text-sm max-w-prose mt-4">
            <i>{'Psss - can\'t volunteer 9-13? Email space@traditionaldreamfactory.com to arrange a paid stay or see if you an work other times.'}</i>
          </p>
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
