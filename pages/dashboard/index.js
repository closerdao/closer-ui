import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Layout from '../../components/Layout';
import Wallet from '../../components/Wallet';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import PageNotAllowed from '../401';
import PageNotFound from '../404';
import { FEATURES, GOVERNANCE_URL } from '../../config';
import { useAuth } from '../../contexts/auth.js';
import { cdn } from '../../utils/api';
import { __ } from '../../utils/helpers';

const dashbboardLinks = [
  {
    label: 'Booking requests',
    url: '/bookings/requests',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Check in',
    url: '/bookings/check-in',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Calendar availability',
    url: '/bookings/calendar',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Edit listings',
    url: '/listings',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Book a stay',
    url: '/bookings/new',
    enabled: () => FEATURES.booking,
  },
  {
    label: 'My bookings',
    url: '/bookings',
    enabled: () => FEATURES.booking,
  },
  {
    label: 'Update profile',
    url: '/settings',
  },
  {
    label: 'Governance',
    url: GOVERNANCE_URL,
    target: '_blank',
    enabled: () => !!GOVERNANCE_URL,
    roles: ['member'],
  },
  {
    label: 'Admin',
    url: '/admin',
    roles: ['admin'],
  },
];

const MemberPage = () => {
  const { user: currentUser, isAuthenticated } = useAuth();

  const links = dashbboardLinks.filter(
    (link) =>
      (!link.enabled || link.enabled()) &&
      (!link.roles ||
        (isAuthenticated &&
          currentUser.roles.some((role) => link.roles.includes(role)))),
  );

  if (!currentUser) {
    return <PageNotFound error={__('errors_user_not_found')} />;
  }
  if (!isAuthenticated) {
    return <PageNotAllowed error={__('errors_please_login')} />;
  }

  return (
    <Layout>
      <Head>
        <title>{currentUser.screenname}</title>
      </Head>
      <div className="main-content">
        <main className="flex flex-col justify-between relative pt-24">
          <div className="flex flex-row items-start">
            <div className="absolute z-10 left-0 top-0 right-0">
              <div className="flex mb-4 justify-center items-center">
                {currentUser.photo ? (
                  <img
                    src={`${cdn}${currentUser.photo}-profile-lg.jpg`}
                    loading="lazy"
                    alt={currentUser.screenname}
                    className="w-32 md:w-44 mt-4 md:mt-0 rounded-full"
                  />
                ) : (
                  <FaUser className="text-gray-200 text-6xl" />
                )}
              </div>
            </div>
            <div className="space-y-5 w-full card pt-20">
              <div className="text-center w-full">
                <h3 className="font-medium text-5xl md:text-6xl">
                  {currentUser.screenname}
                </h3>

                <div className="mt-1 w-full">
                  {currentUser.roles && (
                    <div className="text-sm mt-1 tags">
                      {currentUser.roles.map((role) => (
                        <Link
                          as={`/members?role=${encodeURIComponent(role)}`}
                          href="/members"
                          key={role}
                        >
                          <a className="tag">{role}</a>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="my-4">
            <Wallet />
          </div>
          <div className="py-8">
            {links.map((link) => (
              <Link key={link.url} href={link.url} target={link.target}>
                <a className="mb-4 btn uppercase text-center w-full">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default MemberPage;
