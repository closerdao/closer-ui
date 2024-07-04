import { useRouter } from 'next/router';

import { useState } from 'react';

import api from '../utils/api';
import { trackEvent } from './Analytics';
import { useTranslations } from 'next-intl';


const attemptSignup = async (event, request) => {
  event.preventDefault();
  await api.post('/subscribe', request);
};

const Newsletter = ({ placement, ctaText, className, onSuccess }) => {
  const t = useTranslations();

  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState(null);
  const referrer =
    typeof localStorage !== 'undefined' && localStorage.getItem('referrer');
  const [signupCompleted, setSignupCompleted] = useState(false);
  const router = useRouter();

  return (
    <div className={`Newsletter py-5 ${className}`}>
      {signupError && <div className="error-box">{signupError}</div>}
      {signupCompleted ? (
        <h3>{t('newsletter_success')}</h3>
      ) : (
        <form
          action="#"
          onSubmit={(e) =>
            attemptSignup(e, {
              email,
              screenname: '',
              tags: [placement, router.asPath, `ref:${referrer}`],
            })
              .then(() => {
                trackEvent(placement, 'Lead');
                setSignupCompleted(true);
                setSignupError(null);
                localStorage.setItem('signupCompleted', true);
                if (onSuccess) {
                  onSuccess();
                }
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
          <div className="flex flex-col items-center justify-start px-2 md:mt-0">
            <div className="justify-end">
              <input
                type="email"
                className="mb-4"
                value={email}
                placeholder="Your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" name="subscribe" className="btn-primary">
                {ctaText || t('newsletter_signup')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
Newsletter.defaultProps = {
  ctaText: null,
  className: '',
  placement: 'default',
  onSuccess: null,
};

export default Newsletter;
