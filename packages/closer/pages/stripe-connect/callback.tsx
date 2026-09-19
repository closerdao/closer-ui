import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import Heading from '../../components/ui/Heading';
import Spinner from '../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';
import {
  oauthStatesMatch,
  readStripeConnectOAuthStateFromCookieHeader,
  readStripeConnectReturnToFromCookieHeader,
} from '../../utils/stripeConnectOAuth';
import {
  firstQueryValue,
  resolveStripeConnectReturnTo,
  stripeConnectQueryFromConnectStatus,
  withStripeConnectQuery,
} from '../../utils/stripeConnectReturnTo';
import PageNotFound from '../not-found';

interface Props {
  code: string | null;
  errorMessage: string | null;
  denied: boolean;
  invalidState: boolean;
  redirectUri: string;
  returnTo: string;
}

const completingCodes = new Set<string>();

const StripeConnectCallbackPage = ({
  code,
  errorMessage,
  denied,
  invalidState,
  redirectUri,
  returnTo,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const completionStarted = useRef(false);

  const isAdmin = Boolean(user?.roles?.includes('admin'));

  useEffect(() => {
    if (!code || invalidState || denied || errorMessage || !isAdmin) {
      return;
    }
    if (completingCodes.has(code) || completionStarted.current) {
      return;
    }
    completingCodes.add(code);
    completionStarted.current = true;

    const complete = async () => {
      setIsCompleting(true);
      try {
        const response = await api.post('/stripe/connect/complete', {
          code,
          redirectUri,
        });
        const results = response?.data?.results;
        await router.replace(
          withStripeConnectQuery(
            returnTo,
            stripeConnectQueryFromConnectStatus(results?.connectStatus),
          ),
        );
      } catch {
        await router.replace(withStripeConnectQuery(returnTo, 'failed'));
      }
    };

    void complete();
  }, [
    code,
    denied,
    errorMessage,
    invalidState,
    isAdmin,
    redirectUri,
    returnTo,
    router,
  ]);

  if (!isAuthLoading && !isAdmin) {
    return <PageNotFound error="User may not access" />;
  }

  if (isCompleting || (code && !invalidState && !denied)) {
    return (
      <>
        <Head>
          <title>{t('stripe_connect_title')}</title>
        </Head>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8">
          <Spinner />
          <p className="text-sm">{t('stripe_connect_completing')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('stripe_connect_error_title')}</title>
      </Head>
      <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
        <Heading level={2}>
          {invalidState
            ? t('stripe_connect_csrf_error_title')
            : denied
              ? t('stripe_connect_denied')
              : t('stripe_connect_error_title')}
        </Heading>
        {invalidState ? (
          <p className="text-sm">{t('stripe_connect_csrf_error_body')}</p>
        ) : null}
        {!invalidState && errorMessage ? (
          <p className="text-sm">{errorMessage}</p>
        ) : null}
      </div>
    </>
  );
};

StripeConnectCallbackPage.getInitialProps = async (
  context: NextPageContext,
) => {
  const messages = await loadLocaleData(
    context?.locale,
    process.env.NEXT_PUBLIC_APP_NAME,
  );

  const queryState = firstQueryValue(context.query.state);
  const cookieState = readStripeConnectOAuthStateFromCookieHeader(
    context.req?.headers.cookie,
  );
  const stateValid =
    typeof queryState === 'string' &&
    cookieState !== null &&
    oauthStatesMatch(queryState, cookieState);

  const error = firstQueryValue(context.query.error);
  const errorDescription = firstQueryValue(context.query.error_description);
  const code = firstQueryValue(context.query.code);

  const host = context.req?.headers?.host;
  let proto = 'https';
  const xf = context.req?.headers?.['x-forwarded-proto'];
  if (typeof xf === 'string') {
    proto = xf.split(',')[0]?.trim() ?? proto;
  } else if (host?.startsWith('localhost') || host?.startsWith('127.0.0.1')) {
    proto = 'http';
  }
  const redirectUri = host ? `${proto}://${host}/stripe-connect/callback` : '';

  const cookieReturnTo = readStripeConnectReturnToFromCookieHeader(
    context.req?.headers.cookie,
  );
  const returnTo = resolveStripeConnectReturnTo(cookieReturnTo);

  if (!stateValid) {
    return {
      messages,
      code: null,
      errorMessage: null,
      denied: false,
      invalidState: true,
      redirectUri,
      returnTo,
    };
  }

  if (error === 'access_denied') {
    return {
      messages,
      code: null,
      errorMessage: errorDescription ?? null,
      denied: true,
      invalidState: false,
      redirectUri,
      returnTo,
    };
  }

  if (error) {
    return {
      messages,
      code: null,
      errorMessage: errorDescription ?? error,
      denied: false,
      invalidState: false,
      redirectUri,
      returnTo,
    };
  }

  if (!code) {
    return {
      messages,
      code: null,
      errorMessage: 'Missing authorization code',
      denied: false,
      invalidState: false,
      redirectUri,
      returnTo,
    };
  }

  return {
    messages,
    code,
    errorMessage: null,
    denied: false,
    invalidState: false,
    redirectUri,
    returnTo,
  };
};

export default StripeConnectCallbackPage;
