import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';

const SignupForm = () => {
  const router = useRouter();
  const { back } = router.query || {};
  const [submitted, setSubmitted] = useState(false);
  const { signup, isAuthenticated, error, setError } = useAuth();
  const [application, setApplication] = useState({
    screenname: '',
    phone: '',
    email: '',
    password: '',
    repeatpassword: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!application.email) {
      setError('Please enter a valid email.');
      return;
    }
    if (application.repeatpassword !== application.password) {
      setError('Passwords don`t match.');
      return;
    }
    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      await signup({ ...application, ...(referredBy && { referredBy }) });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const redirect = () => {
    router.push(decodeURIComponent(back || '/'));
  };

  useEffect(() => {
    if (isAuthenticated) {
      redirect();
    }
    if (submitted && back && !error) {
      setTimeout(() => {
        redirect();
      }, 2000);
    }
  }, [isAuthenticated, submitted, back]);

  const updateApplication = (update) => {
    setError(null);
    setApplication((prevState) => ({ ...prevState, ...update }));
  };

  const updateApplicationFields = (update) => {
    setError(null);
    setApplication((prevState) => ({
      ...prevState,
      fields: { ...prevState.fields, ...update },
    }));
  };

  return (
    <div>
      {error && <div className="text-primary mb-4 text-center">{error}</div>}
      {submitted && !error ? (
        <>
          <h2 className="my-4">{__('signup_success')}</h2>
          <p>{__('signup_success_cta')}</p>
        </>
      ) : (
        <form className="join mt-8 flex flex-col" onSubmit={submit}>
          <input
            type="hidden"
            name="backurl"
            value={decodeURIComponent(back || '/')}
          />
          <div className="w-full mb-4">
            <label htmlFor="screenname">{__('signup_form_name')}</label>
            <input
              id="screenname"
              type="text"
              onChange={(e) =>
                updateApplication({
                  screenname: e.target.value,
                })
              }
              placeholder="Jane Birkin"
              className="bg-transparent"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="phone">{__('signup_form_phone_number')}</label>
            <input
              type="phone"
              id="phone"
              value={application.phone}
              onChange={(e) => updateApplication({ phone: e.target.value })}
              placeholder="+1 777 888 999"
              className="bg-transparent"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="email">{__('signup_form_email')}</label>
            <input
              type="email"
              id="email"
              required
              value={application.email}
              onChange={(e) => updateApplication({ email: e.target.value })}
              placeholder="you@project.co"
              className="bg-transparent"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="password">{__('signup_form_password')}</label>
            <input
              type="password"
              id="password"
              required
              value={application.password}
              onChange={(e) => updateApplication({ password: e.target.value })}
              placeholder="****"
              className="bg-transparent"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="repeatpassword">
              {__('signup_form_repeat_password')}
            </label>
            <input
              type="password"
              id="repeatpassword"
              required
              value={application.repeatpassword}
              onChange={(e) =>
                updateApplication({
                  repeatpassword: e.target.value,
                })
              }
              placeholder="****"
              className="bg-transparent"
            />
          </div>
          <div className="w-full mb-4">
            <button id="signupbutton" className="btn-primary" type="submit">
              {__('signup_form_create')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignupForm;
