import { useRouter } from 'next/router';

import React, { useState } from 'react';

import { SIGNUP_FIELDS } from '../config';
import { useAuth } from '../contexts/auth';
import { __, useNextQueryParams } from '../utils/helpers';

const SignupForm = () => {
  const router = useRouter();
  const { back } = useNextQueryParams();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const { signup, isAuthenticated } = useAuth();
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
      const referredBy = localStorage.getItem('referredBy');
      await signup({ ...application, ...(referredBy && { referredBy }) });
      setSubmitted(true);
      window.location.href = decodeURIComponent(back || '/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (isAuthenticated) {
    router.push(decodeURIComponent(back || '/'));
  }

  const updateApplication = (update) =>
    setApplication((prevState) => ({ ...prevState, ...update }));

  const updateApplicationFields = (update) =>
    setApplication((prevState) => ({
      ...prevState,
      fields: { ...prevState.fields, ...update },
    }));

  return (
    <div>
      {error && <div className="error-box">{error}</div>}
      {submitted ? (
        <h2 className="my-4">{__('signup_success')}</h2>
      ) : (
        <form className="join mt-24 flex flex-col" onSubmit={submit}>
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
          {SIGNUP_FIELDS &&
            SIGNUP_FIELDS.map((field) => (
              <div className="w-full mb-4" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <textarea
                  className="textarea bg-transparent"
                  id={field.name}
                  value={application.fields[field.name]}
                  onChange={(e) =>
                    updateApplicationFields({
                      [field.name]: e.target.value,
                    })
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}
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
            <button className="btn-primary" type="submit">
              {__('signup_form_create')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignupForm;
