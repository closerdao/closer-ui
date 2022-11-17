import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import Layout from '../../components/Layout';

import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const SetPasswordScreen = () => {
  const router = useRouter();
  const { completeRegistration, updatePassword, error, isAuthenticated } =
    useAuth();
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
    <Layout>
      <Head>
        <title>{__('login_set_password_title')}</title>
      </Head>
      <div className="mural">
        <main className="main-content center intro">
          {isAuthenticated && router.query.signup_token ? (
            <div className="card">{__('login_set_password_signout')}</div>
          ) : actionCompleted ? (
            <div className="card">
              <p>{__('login_set_password_success')}</p>
              <div className="action-row">
                <Link href="/login">
                  <a className="button">{__('login_set_password_link')}</a>
                </Link>
              </div>
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
              className="card"
            >
              <div className="card-title">
                <h1>{__('login_set_password_registration')}</h1>
              </div>
              <div className="card-body">
                {tokenContent && tokenContent.email && (
                  <p className="mb-4">
                    <i>
                      {__('login_set_password_registration_email')}{' '}
                      <b>{tokenContent.email}</b>.
                    </i>
                  </p>
                )}
                {tokenContent && !tokenContent.screenname && (
                  <div className="form-field">
                    <label htmlFor="screenname">
                      {__('login_set_password_registration_name')}
                    </label>
                    <input
                      type="text"
                      name="screenname"
                      id="screenname"
                      value={screenname}
                      placeholder="John Smith"
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="form-field">
                  <label htmlFor="password">
                    {__('login_set_password_registration_password')}
                  </label>
                  <input
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
              <div className="card-footer">
                <div className="action-row">
                  <button type="submit" className="btn-primary">
                    {__('login_set_password_registration')}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="card">
              {__('login_set_password_registration_error')}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default SetPasswordScreen;
