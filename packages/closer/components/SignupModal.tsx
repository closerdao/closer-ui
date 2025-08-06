import { FormEvent, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { useAuth } from '../contexts/auth';
import { isInputValid } from '../utils/helpers';
import { Button, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';
import api from '../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId?: string;
}

const SignupModal = ({ isOpen, onClose, onSuccess, eventId }: Props) => {
  const t = useTranslations();
  const { signup, error, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
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
      await api.post('/subscribe', {
        email,
        screenname: '',
        tags: ['signup', 'modal', eventId ? `event:${eventId}` : ''],
      });
      
      setNewsletterSuccess(true);
      setNewsletterError(null);
      setApplication({ ...application, email });
      
      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (err: any) {
      setNewsletterError(
        (err.response && err.response.data && err.response.data.error) ||
        err.message
      );
    }
  };

  const handleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.screenname || !application.password) {
      return;
    }

    try {
      await signup({
        ...application,
        preferences: {},
      });
      
      setRegistrationSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      // Error is handled by useAuth
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
                isEnabled={!!email && isInputValid(email, 'email') && !newsletterSuccess && isEmailConsent}
                isLoading={false}
                type="submit"
              >
                {t('signup_step1_continue')}
              </Button>
              
              <div className="text-center text-sm mt-4">
                {t('signup_form_have_account')}{' '}
                <Link
                  className="text-accent underline font-bold"
                  href={`/login?back=${encodeURIComponent(window.location.pathname)}`}
                >
                  {t('login_title')}
                </Link>
              </div>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleAccountSubmit}>
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
                onChange={(e) =>
                  updateApplication({
                    password: e.target.value,
                  })
                }
              />

              {error && <ErrorMessage error={error} />}
              
              <Button
                isEnabled={!!application.screenname && !!application.password && !isLoading}
                isLoading={isLoading}
              >
                {t('signup_form_create')}
              </Button>
              
              <div className="text-center text-sm mt-4">
                {t('signup_form_have_account')}{' '}
                <Link
                  className="text-accent underline font-bold"
                  href={`/login?back=${encodeURIComponent(window.location.pathname)}`}
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