import Link from 'next/link';

import { FormEvent, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import api from '../utils/api';
import { parseMessageFromError, slugify } from '../utils/common';
import { isInputValid, validatePassword } from '../utils/helpers';
import { Button, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId?: string;
}

const SignupModal = ({ isOpen, onClose, onSuccess, eventId }: Props) => {
  const t = useTranslations();
  const { signup, error, isLoading, user, refetchUser } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [application, setApplication] = useState({
    screenname: '',
    email: '',
    password: '',
    fields: {},
  });
  const [isEmailConsent, setIsEmailConsent] = useState(true);

  const updateApplication = (update: any) => {
    setApplication((prevState) => ({ ...prevState, ...update }));
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !isInputValid(email, 'email')) {
      return;
    }

    try {
      const res = await api.post('/check-user-exists', {
        email,
      });
      const doesUserExist = res?.data?.doesUserExist;

      if (doesUserExist) {
        setNewsletterError(t('signup_form_email_exists'));
        return;
      }

      if (process.env.NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE === 'true' && isEmailConsent) {
        await api.post('/subscribe', {
          email,
          screenname: '',
          tags: ['signup', 'modal', eventId ? `event:${eventId}` : ''],
        });
      }

      setNewsletterSuccess(true);
      setNewsletterError(null);
      setApplication({ ...application, email });

      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (err: any) {
      setNewsletterError(
        (err.response && err.response.data && err.response.data.error) ||
          err.message,
      );
    }
  };

  const handleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.screenname || !application.password) {
      return;
    }

    // Validate password before submitting
    const passwordValidation = validatePassword(application.password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.error);
      return;
    }

    setIsSignupLoading(true);
    setLocalError(null);

    try {
      const res = await signup({
        ...application,
        slug: slugify(application.screenname),
        preferences: {},
        emailConsent: isEmailConsent,
      });

      if (res && res.result === 'signup') {
        setRegistrationSuccess(true);

        // If eventId is provided, register the user for the event and send notification
        if (eventId) {
          try {
            // Register user for the event
            const {
              data: { results: event },
            } = await api.post(`/attend/event/${eventId}`, { attend: true });

            // Send event notification - try to get user from context first, then refetch if needed
            let currentUser = user;
            if (!currentUser?._id) {
              try {
                // Wait a bit for the context to update, then refetch user
                await new Promise((resolve) => setTimeout(resolve, 100));
                await refetchUser();
                // Get the updated user from context after refetch
                const userResponse = await api.get('/mine/user');
                currentUser = userResponse.data.results;
              } catch (userError) {
                console.error('Error fetching user:', userError);
              }
            }

            // Access the _id field directly and ensure it's a string
            const userId = currentUser?._id;

            if (userId) {
              const userIdString =
                typeof userId === 'string' ? userId : String(userId);
              await api.post(`/events/${eventId}/notifications`, {
                userId: userIdString,
              });
            } else {
              console.error('No user ID found for notification');
            }
          } catch (eventError) {
            console.error('Event registration error:', eventError);
            // Don't fail the signup if event registration fails
            // The error is logged but not shown to user to avoid confusion
          }
        }

        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Error is already set by the auth context, so we don't need to set it here
        // The user will stay on step 2 and see the error message
      }
    } catch (error) {
      console.error('Signup error:', error);
      setLocalError(parseMessageFromError(error));
    } finally {
      setIsSignupLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 p-6 pb-0">
          <Heading level={2} className="text-xl">
            {step === 1 ? t('signup_step1_title') : t('signup_step2_title')}
          </Heading>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 pb-6">
          {registrationSuccess ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <p className="text-green-600 font-semibold mb-2">
                {t('signup_modal_success')}
              </p>
              <p className="text-gray-600 text-sm">
                {t('signup_modal_event_registration_success')}
              </p>
            </div>
          ) : step === 1 ? (
            <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
              <p className="text-gray-600 text-sm">
                {t('signup_step1_description')}
              </p>

              <Input
                label={t('signup_form_email')}
                placeholder={t('signup_form_email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                validation="email"
              />

              {newsletterError && <ErrorMessage error={newsletterError} />}
              {newsletterSuccess && (
                <div className="text-green-600 text-sm">
                  {t('signup_step1_success')}
                </div>
              )}

              <Checkbox
                className="my-2"
                id="emailConsent"
                isChecked={isEmailConsent}
                onChange={() => setIsEmailConsent(!isEmailConsent)}
              >
                {t('signup_form_email_consent')}
              </Checkbox>

              <Button
                isEnabled={
                  !!email &&
                  isInputValid(email, 'email') &&
                  !newsletterSuccess &&
                  isEmailConsent
                }
                isLoading={false}
                type="submit"
              >
                {t('signup_step1_continue')}
              </Button>

              <div className="text-center text-sm mt-4">
                {t('signup_form_have_account')}{' '}
                <Link
                  className="text-accent underline font-bold"
                  href={`/login?back=${encodeURIComponent(
                    window.location.pathname,
                  )}`}
                >
                  {t('login_title')}
                </Link>
              </div>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={handleAccountSubmit}
            >
              <p className="text-gray-600 text-sm">
                {t('signup_step2_description')}
              </p>

              <Input
                label={t('signup_form_name')}
                placeholder={t('signup_form_name_placeholder')}
                value={application.screenname}
                onChange={(e) =>
                  updateApplication({
                    screenname: e.target.value,
                  })
                }
              />
              <Input
                type="password"
                placeholder={t('signup_form_password_placeholder')}
                label={t('signup_form_password')}
                value={application.password}
                onChange={(e) => {
                  updateApplication({
                    password: e.target.value,
                  });
                  // Clear local error when user starts typing
                  if (localError) {
                    setLocalError(null);
                  }
                }}
              />

              {(localError || error) && (
                <ErrorMessage error={localError || error} />
              )}

              <Button
                isEnabled={
                  !!application.screenname &&
                  !!application.password &&
                  !isSignupLoading
                }
                isLoading={isSignupLoading}
              >
                {isSignupLoading
                  ? 'Creating account...'
                  : t('signup_form_create')}
              </Button>

              <div className="text-center text-sm mt-4">
                {t('signup_form_have_account')}{' '}
                <Link
                  className="text-accent underline font-bold"
                  href={`/login?back=${encodeURIComponent(
                    window.location.pathname,
                  )}`}
                >
                  {t('login_title')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
