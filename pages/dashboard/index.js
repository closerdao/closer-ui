import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Layout from '../../components/Layout';
import Profile from '../../components/Profile';
import Wallet from '../../components/Wallet';

import PageNotAllowed from '../401';
import PageNotFound from '../404';
import { FEATURES, GOVERNANCE_URL } from '../../config';
import { useAuth } from '../../contexts/auth.js';
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
    url: '/bookings/create',
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
          <Profile />
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
