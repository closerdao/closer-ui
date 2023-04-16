import Head from 'next/head';

import React from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';

import { __ } from '../../utils/helpers';

const Signup = () => (
  <>
    <Head>
      <title>{__('signup_title')}</title>
    </Head>
    <main className="main-content mt-12 px-4 max-w-prose mx-auto">
      <h1 className="text-center mb-6 text-4xl">{__('signup_title')}</h1>
      <h2 className="text-center mb-6">{__('signup_sub_title')}</h2>
      {/* <p className="text-center mb-8 text-sm">{__('signup_body')}</p> */}
      {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
        <ApplicationForm />
      ) : (
        <SignupForm />
      )}
    </main>
  </>
);

export default Signup;
