import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import api from '../utils/api';
import Heading from './ui/Heading';

const ApplicationForm = () => {
  const t = useTranslations();

  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState({
    name: '',
    phone: '',
    email: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!application.email || !application.phone) {
      alert('Please enter an email & phone.');
      return;
    }
    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      await api.post('/application', {
        ...application,
        ...(referredBy && { referredBy }),
      });
      setSubmitted(true);
    } catch (err) {
      alert('There was an error sending your application, please try again.');
    }
  };

  const updateApplication = (update) =>
    setApplication((prevApplication) => ({ ...prevApplication, ...update }));

  return (
    <div>
      {submitted ? (
        <Heading level={2} className="my-4">
          {t('apply_success')}
        </Heading>
      ) : (
        <form className="join mt-24 flex flex-col" onSubmit={submit}>
          <div className="w-full mb-4">
            <label htmlFor="screenname">{t('apply_name')}</label>
            <input
              id="screenname"
              type="text"
              onChange={(e) => updateApplication({ name: e.target.value })}
              placeholder="Jane Birkin"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="phone">{t('apply_phone_number')}</label>
            <input
              type="phone"
              required
              id="phone"
              value={application.phone}
              onChange={(e) => updateApplication({ phone: e.target.value })}
              placeholder="+1 777 888 999"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="email">{t('apply_email')}</label>
            <input
              type="email"
              id="email"
              required
              value={application.email}
              onChange={(e) => updateApplication({ email: e.target.value })}
              placeholder="you@project.co"
            />
          </div>
          <div className="w-full mb-4">
            <button id="signupbutton" className="btn-primary" type="submit">
              {t('apply_submit_button')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ApplicationForm;
