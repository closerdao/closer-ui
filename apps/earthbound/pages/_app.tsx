import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useState } from 'react';

import { ErrorBoundary, Layout } from '@/components';

import AcceptCookies from 'closer/components/AcceptCookies';

import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  api,
  getConfig,
} from 'closer';
import { WalletProvider } from 'closer/contexts/wallet';
import { blockchainConfig } from 'closer/config_blockchain';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { NewsletterProvider } from 'closer/contexts/newsletter';
import { PushNotificationProvider } from 'closer/contexts/push-notifications';
import {
  mergeGeneralConfigWithDefaults,
  prepareGeneralConfig,
} from 'closer/utils/app.helpers';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { getAppConfigFromEnv } from 'closer/utils/appConfigFromEnv';
import '../styles/index.css';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

const MyApp = ({ Component, pageProps }: AppOwnProps) => {
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  const [config, setConfig] = useState<any>(() => ({
    ...prepareGeneralConfig(mergeGeneralConfigWithDefaults(null)),
    _configLoaded: false,
  }));

  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, [referral]);

  useEffect(() => {
    (async () => {
      try {
        const keyedConfig = await getConfig(api);
        const mergedGeneral = mergeGeneralConfigWithDefaults(keyedConfig.general);
        setConfig({
          ...prepareGeneralConfig(mergedGeneral),
          ...keyedConfig,
          _configLoaded: true,
        });
      } catch (err) {
        console.error(err);
        setConfig((prev: any) => ({ ...prev, _configLoaded: true }));
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      </Head>

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

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
          ...getAppConfigFromEnv(),
        }}
      >
        <ErrorBoundary>
          <NextIntlClientProvider
            locale={router.locale || 'en'}
            messages={pageProps.messages || {}}
            timeZone={config?.TIME_ZONE || process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || getAppConfigFromEnv().DEFAULT_TIMEZONE}
          >
            <AuthProvider>
              <PlatformProvider>
                <WalletProvider>
                  <PushNotificationProvider>
                    <Layout>
                      <GoogleAnalytics trackPageViews />
                      <NewsletterProvider>
                        <Component {...pageProps} config={config} />
                      </NewsletterProvider>
                    </Layout>
                    <AcceptCookies />
                  </PushNotificationProvider>
                </WalletProvider>
              </PlatformProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </ConfigProvider>
    </>
  );
};

export default MyApp;
