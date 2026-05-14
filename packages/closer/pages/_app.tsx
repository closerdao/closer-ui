import type { AbstractIntlMessages } from 'next-intl';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useState } from 'react';
import 'react-image-lightbox/style.css';

import { PromptGetInTouchProvider } from '../components/PromptGetInTouchContext';
import PushNotificationModal from '../components/PushNotificationModal';

import {
  AuthProvider,
  ConfigProvider,
  ErrorBoundary,
  PlatformProvider,
} from 'closer';
import LocaleMessagesNextIntlBridge from '../components/LocaleMessagesNextIntlBridge';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import {
  applyCurrencyLocaleFromGeneralConfig,
  mergeGeneralConfigWithDefaults,
  prepareGeneralConfig,
} from 'closer/utils/app.helpers';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { blockchainConfig } from '../config_blockchain';
import configKeyed from '../configCached';
import { NewsletterProvider } from '../contexts/newsletter';
import { PushNotificationProvider } from '../contexts/push-notifications';
import { WalletProvider } from '../contexts/wallet';
import { useNavigationMetrics } from '../hooks/useNavigationMetrics';
import { appGetInitialPropsWithMessages } from '../utils/appLocaleMessages.helpers';
import { linkedMetricFields, logMetric } from '../utils/metrics';

interface AppOwnProps extends AppProps {
  configGeneral: any;
  messages?: AbstractIntlMessages;
}

const buildStateFromKeyedConfig = (
  keyedConfig: Record<string, any>,
  configLoaded: boolean,
) => {
  const mergedGeneral = mergeGeneralConfigWithDefaults({
    ...keyedConfig.general,
    rbacConfig: keyedConfig.rbac || {},
  });
  applyCurrencyLocaleFromGeneralConfig(mergedGeneral);
  return {
    ...prepareGeneralConfig(mergedGeneral),
    ...keyedConfig,
    _configLoaded: configLoaded,
  };
};

const MyApp = ({ Component, pageProps, messages }: AppOwnProps) => {
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  const [config] = useState<any>(() =>
    buildStateFromKeyedConfig(configKeyed, true),
  );

  const { FACEBOOK_PIXEL_ID } = config || {};

  useNavigationMetrics();

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);

      void logMetric({
        event: 'referral-view',
        category: 'affiliate',
        value: String(referral),
        number: 1,
        ...linkedMetricFields(
          'Affiliate',
          typeof referral === 'string' ? referral : undefined,
        ),
      });
    }
  }, [referral]);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      </Head>

      {FACEBOOK_PIXEL_ID && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${FACEBOOK_PIXEL_ID}');
  fbq('track', 'PageView');
  `,
          }}
        />
      )}

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
        }}
      >
        <LocaleMessagesNextIntlBridge
          initialMessages={messages || {}}
          timeZone={config.timeZone || 'Europe/Lisbon'}
        >
          <AuthProvider>
            <PlatformProvider>
              <WalletProvider>
                <PushNotificationProvider>
                  <GoogleAnalytics trackPageViews />
                  <PromptGetInTouchProvider>
                    <NewsletterProvider>
                      <PushNotificationModal />
                      <ErrorBoundary>
                        <Component {...pageProps} config={config} />
                      </ErrorBoundary>
                    </NewsletterProvider>
                  </PromptGetInTouchProvider>
                </PushNotificationProvider>
              </WalletProvider>
            </PlatformProvider>
          </AuthProvider>
        </LocaleMessagesNextIntlBridge>
      </ConfigProvider>
    </>
  );
};

MyApp.getInitialProps = appGetInitialPropsWithMessages;

export default MyApp;
