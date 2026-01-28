import Link from 'next/link';

import { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';

const COOKIE_CONSENT_KEY = 'CookieConsent';

const AcceptCookies = () => {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    Cookies.set(COOKIE_CONSENT_KEY, 'true', { expires: 365 });
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-[1] bg-white border-b border-gray-200">
      <div className="flex items-center justify-center gap-3 px-4 py-2">
        <p className="text-sm text-gray-600">
          {t('cookie_consent_text')}{' '}
          <Link href="/privacy-policy" className="underline hover:text-gray-900">
            {t('cookie_consent_text_link')}
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-full hover:bg-gray-200 transition-colors"
        >
          {t('cookie_consent_button')}
        </button>
      </div>
    </div>
  );
};

export default AcceptCookies;
