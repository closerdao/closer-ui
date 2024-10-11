import Link from 'next/link';

import React from 'react';
import CookieConsent from 'react-cookie-consent';

import { useTranslations } from 'next-intl';

const AcceptCookies = () => {
  const t = useTranslations();
  return (
    <CookieConsent
      buttonText={t('cookie_consent_button')}
      expires={365}
      style={{ background: '#ffffff', borderTop: '1px solid #F3F4F6' }}
      buttonStyle={{
        borderRadius: '20px',
        padding: '5px 15px 5px 15px',
        color: '#000',
        background: '#ffffff',
        fontSize: '13px',
        border: '1px solid #000',
      }}
    >
      <div className="text-black text-sm">
        {t('cookie_consent_text')}{' '}
        <Link className="underline" href="/pdf/TDF-Cookies.pdf">
          {t('cookie_consent_text_link')}
        </Link>
      </div>
    </CookieConsent>
  );
};

export default AcceptCookies;
