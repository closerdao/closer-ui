import Head from 'next/head';

import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { loadLocaleData } from '../../utils/locale.helpers';
import {
  oauthStatesMatch,
  readStripeConnectOAuthStateFromCookieHeader,
} from '../../utils/stripeConnectOAuth';

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}

function getBaseUrl(context: NextPageContext): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const req = context.req;
  if (!req?.headers?.host) {
    return process.env.NEXT_PUBLIC_PLATFORM_URL ?? '';
  }
  const host = req.headers.host;
  let proto = 'https';
  const xf = req.headers['x-forwarded-proto'];
  if (typeof xf === 'string') {
    proto = xf.split(',')[0]?.trim() ?? proto;
  } else if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    proto = 'http';
  }
  return `${proto}://${host}`;
}

type TokenApiSuccess = { stripeUserId: string };
type TokenApiError = { error: string };

interface Props {
  stripeUserId: string | null;
  errorMessage: string | null;
  denied: boolean;
  invalidState: boolean;
}

const StripeConnectCallbackPage = ({
  stripeUserId,
  errorMessage,
  denied,
  invalidState,
}: Props) => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>
          {stripeUserId
            ? t('stripe_connect_success_title')
            : t('stripe_connect_error_title')}
        </title>
      </Head>
      <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
        {stripeUserId ? (
          <>
            <Heading level={2}>{t('stripe_connect_success_title')}</Heading>
            <p className="text-sm">{t('stripe_connect_success_copy_hint')}</p>
            <pre className="overflow-x-auto rounded border border-neutral bg-dominant p-4 text-sm">
              {stripeUserId}
            </pre>
          </>
        ) : (
          <>
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
              <p className="text-sm ">{errorMessage}</p>
            ) : null}
          </>
        )}
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

  if (!stateValid) {
    return {
      messages,
      stripeUserId: null,
      errorMessage: null,
      denied: false,
      invalidState: true,
    };
  }

  if (error === 'access_denied') {
    return {
      messages,
      stripeUserId: null,
      errorMessage: errorDescription ?? null,
      denied: true,
      invalidState: false,
    };
  }

  if (error) {
    return {
      messages,
      stripeUserId: null,
      errorMessage: errorDescription ?? error,
      denied: false,
      invalidState: false,
    };
  }

  if (!code) {
    return {
      messages,
      stripeUserId: null,
      errorMessage: 'Missing authorization code',
      denied: false,
      invalidState: false,
    };
  }

  const baseUrl = getBaseUrl(context);
  const tokenUrl = `${baseUrl}/api/stripe-connect/token`;

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data: unknown = await tokenRes.json();

  if (
    tokenRes.ok &&
    data !== null &&
    typeof data === 'object' &&
    'stripeUserId' in data &&
    typeof (data as TokenApiSuccess).stripeUserId === 'string'
  ) {
    return {
      messages,
      stripeUserId: (data as TokenApiSuccess).stripeUserId,
      errorMessage: null,
      denied: false,
      invalidState: false,
    };
  }

  if (
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as TokenApiError).error === 'string'
  ) {
    return {
      messages,
      stripeUserId: null,
      errorMessage: (data as TokenApiError).error,
      denied: false,
      invalidState: false,
    };
  }

  return {
    messages,
    stripeUserId: null,
    errorMessage: 'Unexpected response',
    denied: false,
    invalidState: false,
  };
};

export default StripeConnectCallbackPage;
