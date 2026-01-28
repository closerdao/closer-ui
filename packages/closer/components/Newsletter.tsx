import { useRouter } from 'next/router';

import { FormEvent, forwardRef, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { useAuth, useConfig } from '..';
import api from '../utils/api';
import { trackEvent } from './Analytics';
import TurnstileWidget from './TurnstileWidget';
import { Button, ErrorMessage, Input } from './ui';



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
    const [mounted, setMounted] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const [shouldShowForm, setShouldShowForm] = useState(true);
    const router = useRouter();

    const attemptSignup = async (
      event: FormEvent<HTMLFormElement>,
      request: {
        email: string;
        screenname: string;
        tags: string[];
        turnstileToken: string | null;
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
      setMounted(true);
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

    if (!mounted) return null;
    if (isAuthenticated || APP_NAME !== 'tdf' || !shouldShowForm) return null;

    const isInlinePrompt = placement === 'HomePagePrompt';

    return (
      <div
        ref={ref}
        className={twMerge(
          'Newsletter',
          isInlinePrompt ? '' : 'pt-8 pb-5 w-auto sm:w-[280px]',
          className,
        )}
      >

        {email.length > 0 && (
          <div
            className="fixed bottom-20 z-51 left-0 right-0 mx-auto animate-[fadeIn_0.3s_ease-in-out]"
          >
            <TurnstileWidget
              action="newsletter_signup"
              onVerify={setTurnstileToken}
              size="flexible"
            />
          </div>
        )}
        {signupCompleted ? (
          <p className={isInlinePrompt ? 'text-sm text-green-600 font-medium' : ''}>
            {t('newsletter_success')}
          </p>
        ) : (
          <form
            action="#"
            onSubmit={(e) =>
              attemptSignup(e, {
                email,
                screenname: '',
                tags: [
                  placement || null,
                  router.asPath,
                  referrer ? `ref:${referrer}` : null,
                ].filter(Boolean) as string[],
                turnstileToken,
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
            className={isInlinePrompt ? 'flex items-center gap-2' : 'flex flex-col justify-center'}
          >
            {!isInlinePrompt && showTitle && (
              <div className="hidden min-[1100px]:flex flex-col justify-start md:mt-0 gap-y-2">
                {t('newsletter_title')}
              </div>
            )}
            <div className={isInlinePrompt ? 'flex items-center gap-2 flex-1' : 'flex gap-2 sm:gap-4'}>
              <Input
                type="text"
                className={twMerge(
                  'bg-white border !border-gray-300 rounded-md flex-1 min-w-0',
                  isInlinePrompt ? 'h-9 text-sm px-3' : 'p-2'
                )}
                value={email}
                placeholder={t('newsletter_email_placeholder') || 'Your email'}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                size="small"
                type="submit"
                variant="primary"
                isFullWidth={false}
                isEnabled={!!turnstileToken}
                className={twMerge('shrink-0', isInlinePrompt && 'h-9 text-xs px-4')}
              >
                {ctaText || t('newsletter_signup')}
              </Button>
            </div>
            {signupError && <ErrorMessage error={signupError} />}
          </form>
        )}
      </div>
    );
  },
);

Newsletter.displayName = 'Newsletter';

export default Newsletter;
