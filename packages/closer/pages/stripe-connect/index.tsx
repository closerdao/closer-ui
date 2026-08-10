import Head from 'next/head';

import { useEffect, useState } from 'react';

import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { STRIPE_CONNECT_CLIENT_ID } from '../../constants/shared.constants';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const StripeConnectPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const [authorizeHref, setAuthorizeHref] = useState('');

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const redirectUri = `${window.location.origin}/stripe-connect/callback`;
      const res = await fetch('/api/stripe-connect/oauth-state', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok || cancelled) {
        return;
      }
      const body = (await res.json()) as { state?: string };
      if (!body.state || cancelled) {
        return;
      }
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: STRIPE_CONNECT_CLIENT_ID,
        scope: 'read_write',
        redirect_uri: redirectUri,
        state: body.state,
      });
      setAuthorizeHref(
        `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
      );
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || !user.roles?.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('stripe_connect_title')}</title>
      </Head>
      <div className="mx-auto flex max-w-md flex-col gap-6 p-8">
        <Heading level={2}>{t('stripe_connect_title')}</Heading>
        <p className="text-sm ">{t('stripe_connect_description')}</p>
        <a
          href={authorizeHref || undefined}
          className={
            authorizeHref
              ? 'inline-flex w-fit rounded-full border-2 border-accent bg-accent px-4 py-2 text-center text-lg uppercase tracking-wide text-white'
              : 'pointer-events-none inline-flex w-fit rounded-full border-2 border-disabled bg-neutral px-4 py-2 text-center text-lg uppercase tracking-wide text-disabled'
          }
        >
          {t('stripe_connect_button')}
        </a>
      </div>
    </>
  );
};

StripeConnectPage.getInitialProps = async (context: NextPageContext) => {
  const messages = await loadLocaleData(
    context?.locale,
    process.env.NEXT_PUBLIC_APP_NAME,
  );
  return { messages };
};

export default StripeConnectPage;
