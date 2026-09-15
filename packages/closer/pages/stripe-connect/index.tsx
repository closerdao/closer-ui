import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import StripeConnectPrompt from '../../components/StripeConnectPrompt';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { STRIPE_CONNECT_CLIENT_ID } from '../../constants/shared.constants';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';
import {
    firstQueryValue,
    resolveStripeConnectReturnTo,
} from '../../utils/stripeConnectReturnTo';
import PageNotFound from '../not-found';

const StripeConnectPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [authorizeHref, setAuthorizeHref] = useState('');

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const redirectUri = `${window.location.origin}/stripe-connect/callback`;
      const returnTo = resolveStripeConnectReturnTo(
        firstQueryValue(router.query.returnTo),
      );
      const res = await fetch('/api/stripe-connect/oauth-state', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo }),
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
        stripe_landing: 'login',
      });
      setAuthorizeHref(
        `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
      );
    };

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [router.query.returnTo]);

  if (!user || !user.roles?.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('stripe_connect_title')}</title>
      </Head>
      <StripeConnectPrompt authorizeHref={authorizeHref} />
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
