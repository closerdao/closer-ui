import Head from 'next/head';

import React, { useState } from 'react';

import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isResetCompleted, setIsResetCompleted] = useState(false);

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reset-password', { email });
      setIsResetCompleted(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <>
      <Head>
        <title>{__('login_forgot_password_title')}</title>
      </Head>

      <main className="main-content max-w-prose center intro flex flex-col justify-center flex-1">
        {error && <div className="text-primary my-4 text-center">{error}</div>}
        {isResetCompleted ? (
          <div className="success">
            <h1 className="mb-4">{__('login_forgot_password_subtitle')}</h1>
            <p>{__('login_forgot_password_cta', email)}</p>
          </div>
        ) : (
          <form className="w-80" onSubmit={requestPasswordReset}>
            <label htmlFor="email">{__('login_forgot_password_email')}</label>
            <input
              className="bg-transparent"
              type="email"
              name="email"
              id="email"
              value={email}
              placeholder="you@awesomeproject.org"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className="btn mt-4">
              {__('login_forgot_password_submit')}
            </button>
          </form>
        )}
      </main>
    </>
  );
};

export default ForgotPasswordScreen;
