import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const SetPasswordScreen = () => {
  const router = useRouter();
  const { completeRegistration, updatePassword, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [screenname, setName] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  let tokenContent = {};

  if (router.query.signup_token) {
    try {
      tokenContent = JSON.parse(atob(router.query.signup_token.split('.')[1]));
    } catch (err) {
      console.log('Failed to parse token:', err);
    }
  }

  return (
    <>
      <Head>
        <title>{__('login_set_password_title')}</title>
      </Head>

      <main className="main-content max-w-prose center intro flex-1 flex flex-col justify-center">
        {isAuthenticated && router.query.signup_token ? (
          <div className="">{__('login_set_password_signout')}</div>
        ) : actionCompleted ? (
          <div className="">
            <p>{__('login_set_password_success')}</p>
            <Link href="/login" className="btn mt-4 md: w-fit">
              {__('login_set_password_link')}
            </Link>
          </div>
        ) : router.query.signup_token || router.query.reset_token ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (router.query.reset_token) {
                updatePassword(router.query.reset_token, password, () =>
                  setActionCompleted(true),
                );
              } else if (router.query.signup_token) {
                completeRegistration(
                  router.query.signup_token,
                  {
                    password,
                    screenname,
                  },
                  () => router.push('/'),
                );
              }
            }}
            className=""
          >
            <h1 className="mb-8">{__('login_set_password_registration')}</h1>

            <div className="flex flex-col gap-4">
              {tokenContent && tokenContent.email && (
                <p className="mb-4">
                  <i>
                    {__('login_set_password_registration_email')}{' '}
                    <b>{tokenContent.email}</b>.
                  </i>
                </p>
              )}
              {tokenContent && !tokenContent.screenname && router.query.signup_token && (
                <>
                  <label htmlFor="screenname">
                    {__('login_set_password_registration_name')}
                  </label>
                  <input
                    className="bg-transparent"
                    type="text"
                    name="screenname"
                    id="screenname"
                    value={screenname}
                    placeholder="John Smith"
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </>
              )}
              <div>
                <label htmlFor="password">
                  {__('login_set_password_registration_password')}
                </label>
                <input
                  className="bg-transparent"
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  placeholder="#sup3rs3cr3t"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-8">
              {__('login_set_password_registration')}
            </button>
          </form>
        ) : (
          <div className="card">
            {__('login_set_password_registration_error')}
          </div>
        )}
      </main>
    </>
  );
};

export default SetPasswordScreen;
