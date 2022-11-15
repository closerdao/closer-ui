import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import Layout from '../../components/Layout';

import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const Login = () => {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated && typeof window.location !== 'undefined') {
    // router.push('/');
    // For some reason, cache needs to get reset.
    window.location.href = decodeURIComponent(router.query.back || '/');
  }

  return (
    <Layout>
      <Head>
        <title>{__('login_title')}</title>
      </Head>
      <div className="mural">
        <main className="main-content max-w-prose center intro">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login(email, password);
            }}
          >
            <div className="w-full mb-4">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                htmlFor="email"
              >
                {__('login_email')}
              </label>
              <input
                className="w-full"
                type="email"
                name="email"
                id="email"
                value={email}
                placeholder="name@awesomeproject.co"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full mb-4">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                htmlFor="password"
              >
                {__('login_password')}
              </label>
              <input
                className="w-full"
                type="password"
                name="password"
                id="password"
                value={password}
                placeholder="*****"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="card-footer">
              <div className="action-row">
                <button type="submit" className="btn-primary">
                  {__('login_submit')}
                </button>
                <hr className="my-4" />
                <p>
                  <Link
                    href="/login/forgot-password"
                    as="/login/forgot-password"
                  >
                    <a>{__('login_link_forgot_password')}</a>
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </Layout>
  );
};

export default Login;
