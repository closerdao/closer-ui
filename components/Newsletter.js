import { useRouter } from 'next/router';

import React, { useState } from 'react';

import api from '../utils/api';
import { __ } from '../utils/helpers';
import { trackEvent } from './Analytics';

const attemptSignup = async (event, request) => {
  event.preventDefault();
  await api.post('/subscribe', request);
};

const Newsletter = ({ tags, placement }) => {
  const [screenname, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState(null);
  const didCompleteSignup = Boolean(
    typeof localStorage !== 'undefined' &&
      localStorage.getItem('signupCompleted'),
  );
  const referrer =
    typeof localStorage !== 'undefined' && localStorage.getItem('referrer');
  const [signupCompleted, setSignupCompleted] = useState(false);
  const router = useRouter();

  // if (didCompleteSignup) {
  //   return null;
  // }

  return (
    <div className="Newsletter py-5 text-neutral-900">
      {signupError && <div className="error-box">{signupError}</div>}
      {signupCompleted ? (
        <h3>{__('newsletter_success')}</h3>
      ) : (
        <form
          action="#"
          onSubmit={(e) =>
            attemptSignup(e, {
              email,
              screenname,
              tags: [placement, router.asPath, `ref:${referrer}`],
            })
              .then(() => {
                trackEvent(placement, 'Lead');
                setSignupCompleted(true);
                localStorage.setItem('signupCompleted', true);
              })
              .catch((err) => {
                trackEvent(placement, 'LeadError');
                setSignupError(
                  (err.response &&
                    err.response.data &&
                    err.response.data.error) ||
                    err.message,
                );
              })
          }
          className="flex flex-row items-center justify-center"
        >
          <div className="flex flex-col items-center justify-start px-2 mt-12 md:mt-0">
            {/* <p className='mb-2 self-start'>{ __('newsletter_body') }</p> */}

            <div className="flex flex-row justify-end">
              <input
                type="email"
                className="mr-2"
                value={email}
                placeholder="Your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                name="subscribe"
                className="btn-primary w-36"
              >
                {__('newsletter_signup')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Newsletter;
