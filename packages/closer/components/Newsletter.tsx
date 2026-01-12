import { useRouter } from 'next/router';

import { FormEvent, forwardRef, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { useAuth, useConfig } from '..';
import api from '../utils/api';
import { trackEvent } from './Analytics';
import { Button, ErrorMessage, Heading, Input } from './ui';



interface Props {
  placement?: string;
  ctaText?: string;
  className?: string;
  onSuccess?: (email: string) => void;
  showTitle?: boolean;
}

const Newsletter = forwardRef<HTMLDivElement, Props>(
  ({ placement, ctaText, className, onSuccess, showTitle = true }, ref) => {
    const t = useTranslations();
    const { isAuthenticated } = useAuth();
    const { APP_NAME } = useConfig() || {};

    const [email, setEmail] = useState('');
    const [signupError, setSignupError] = useState(null);
    const [referrer, setReferrer] = useState<string | undefined>(undefined);
    const [signupCompleted, setSignupCompleted] = useState(false);

    const [shouldShowForm, setShouldShowForm] = useState(true);
    const router = useRouter();

    const attemptSignup = async (
      event: FormEvent<HTMLFormElement>,
      request: {
        email: string;
        screenname: string;
        tags: [string | undefined, string, string];
      },
    ) => {
      try {
        event.preventDefault();
        await api.post('/subscribe', request);
      } catch (error) {
        console.error(error);
      }
    };

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const completed = localStorage.getItem('signupCompleted') === 'true';
        if (completed) {
          setShouldShowForm(false);
        }
        const storedReferrer = localStorage.getItem('referrer');
        if (storedReferrer) {
          setReferrer(storedReferrer);
        }
      }
    }, []);

    if (isAuthenticated || APP_NAME !== 'tdf' || !shouldShowForm) return null;

    return (
      <div
        ref={ref}
        className={`${twMerge(
          'Newsletter pt-8 pb-5 w-auto sm:w-[280px]',
          className,
        )}`}
      >
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
                  localStorage.setItem('signupCompleted', 'true');
                  if (onSuccess) {
                    onSuccess(email);
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
            className="flex flex-col justify-center"
          >
              <div className="flex flex-col justify-start md:mt-0 gap-y-2">
                
                {showTitle && placement !== 'HomePagePrompt' && (
                  <Heading display level={4}>
                    {t('newsletter_title')}
                  </Heading>
                )}
              <div className="flex gap-4">
                <Input
                  type="text"
                  className="bg-white border !border-gray-400 rounded-md p-2 w-[140px] sm:w-[180px]"
                  value={email}
                  placeholder="Your email"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button size="small" type="submit" variant="secondary">
                  {ctaText || t('newsletter_signup')}
                </Button>
              </div>
            </div>
            <div>{signupError && <ErrorMessage error={signupError} />}</div>
          </form>
        )}
      </div>
    );
  },
);

Newsletter.displayName = 'Newsletter';

export default Newsletter;
