import Head from 'next/head';

import React from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import Layout from '../../components/Layout';
import SignupForm from '../../components/SignupForm';

import { __ } from '../../utils/helpers';

const Signup = () => (
  <Layout>
    <Head>
      <title>{__('signup_title')}</title>
    </Head>
    <main className="main-content mt-12 px-4 max-w-prose mx-auto">
      <h1 className="mb-2 text-3xl">{__('signup_title')}</h1>
      <p className="mb-8">{__('signup_body')}</p>
      {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
        <ApplicationForm />
      ) : (
        <SignupForm />
      )}
    </main>
  </Layout>
);

export default Signup;
