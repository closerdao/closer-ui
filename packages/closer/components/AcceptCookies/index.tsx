import Link from 'next/link';

import { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';

import {
  COOKIE_CONSENT_KEY,
  applyConsentPersistence,
} from '../../utils/posthog';

const BODY_CLASS = 'has-cookie-bar';

/**
 * Every app mounts this banner as a sibling of <Layout>, but the next/font CSS
 * variables (--font-inter and friends) are declared on a wrapper *inside*
 * Layout. `font-sans` therefore resolves to an undefined variable here and the
 * text falls back to the browser default, which is a serif. Pin a standard
 * sans stack so the banner renders consistently in every app.
 */
const SYSTEM_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const AcceptCookies = () => {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
      document.body.classList.add(BODY_CLASS);
    }
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, []);

  const handleAccept = () => {
    Cookies.set(COOKIE_CONSENT_KEY, 'true', { expires: 365 });
    applyConsentPersistence();
    setIsVisible(false);
    document.body.classList.remove(BODY_CLASS);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-20 left-0 right-0 z-10 bg-background border-b border-gray-200"
      style={{ fontFamily: SYSTEM_SANS }}
    >
      <div className="flex items-center justify-center gap-3 px-4 py-2">
        <p className="text-sm text-foreground/70">
          {t('cookie_consent_text')}{' '}
          <Link href="/privacy-policy" className="underline hover:text-foreground">
            {t('cookie_consent_text_link')}
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-3 py-1 text-sm font-medium text-foreground bg-neutral border border-gray-300 rounded-full hover:bg-neutral-dark transition-colors"
        >
          {t('cookie_consent_button')}
        </button>
      </div>
    </div>
  );
};

export default AcceptCookies;
