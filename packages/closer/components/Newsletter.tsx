import { useRouter } from 'next/router';

import { useState, useEffect } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth, useConfig } from '..';
import api from '../utils/api';
import { trackEvent } from './Analytics';
import { Button, ErrorMessage, Heading } from './ui';

const attemptSignup = async (
  event: React.FormEvent<HTMLFormElement>,
  request: {
    email: string;
    screenname: string;
    tags: [string | undefined, string, string];
  },
) => {
  event.preventDefault();
  await api.post('/subscribe', request);
};

interface Props {
  placement?: string;
  ctaText?: string;
  className?: string;
  onSuccess?: () => void;
}

const Newsletter = ({ placement, ctaText, className, onSuccess }: Props) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const { APP_NAME } = useConfig() || {};

  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState(null);
  const referrer =
    typeof localStorage !== 'undefined' && localStorage.getItem('referrer');
  const [signupCompleted, setSignupCompleted] = useState(false);

  const [shouldShowForm, setShouldShowForm] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('signupCompleted') === 'true';
      if (completed) {
        setShouldShowForm(false);
      }
    }
  }, []);

  if (isAuthenticated || APP_NAME !== 'tdf' || !shouldShowForm) return null;

  return (
    <div className={`Newsletter pt-12 pb-5 px-4 ${className}`}>
      {!signupCompleted ? (
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
                localStorage.setItem('signupCompleted', 'true');
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
          className="flex flex-col items-center  justify-center"
        >
          <div className="flex flex-col justify-start px-2 md:mt-0 gap-y-2">
            <Heading display level={4}>
              {t('newsletter_title')}
            </Heading>
            <div className="flex gap-4">
              <input
                type="text"
                className="bg-gray-100 rounded-md p-2 border-none w-[140px] sm:w-[180px]"
                value={email}
                placeholder="Your email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button size="small" type="submit" variant="secondary">
                {ctaText || t('newsletter_signup')}
              </Button>
            </div>
          </div>
          <div className="w-[290px]">
            {signupError && <ErrorMessage error={signupError} />}
          </div>
        </form>
      )}
    </div>
  );
};

export default Newsletter;