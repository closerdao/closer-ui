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
  api,
  getConfig,
} from 'closer';
import { configDescription } from 'closer/config';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import {
  mergeGeneralConfigWithDefaults,
  prepareGeneralConfig,
} from 'closer/utils/app.helpers';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { blockchainConfig } from '../config_blockchain';
import { NewsletterProvider } from '../contexts/newsletter';
import { PushNotificationProvider } from '../contexts/push-notifications';
import { WalletProvider } from '../contexts/wallet';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

const prepareDefaultConfig = () => {
  const general =
    configDescription.find((config) => config.slug === 'general')?.value ?? {};
  const transformedObject = Object.entries(general).reduce((acc, [key]) => {
    return { ...acc, [key]: '' };
  }, {});
  return transformedObject;
};

const MyApp = ({ Component, pageProps }: AppOwnProps) => {
  const defaultGeneralConfig = prepareDefaultConfig();

  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  const [config, setConfig] = useState<any>(
    prepareGeneralConfig(defaultGeneralConfig),
  );

  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);

      (async () => {
        try {
          await api.post('/metric', {
            event: 'referral-view',
            value: referral,
            number: 1,
            point: 1,
            category: 'engagement',
          });
        } catch (error) {
          console.error('Error tracking referral view:', error);
        }
      })();
    }
  }, [referral]);

  useEffect(() => {
    (async () => {
      try {
        const keyedConfig = await getConfig(api);
        const mergedGeneral = mergeGeneralConfigWithDefaults({
          ...keyedConfig.general,
          rbacConfig: keyedConfig.rbac || {},
        });
        setConfig({
          ...prepareGeneralConfig(mergedGeneral),
          ...keyedConfig,
          _configLoaded: true,
        });
      } catch (err) {
        console.error(err);
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
        <NextIntlClientProvider
          locale={router.locale || 'en'}
          messages={pageProps.messages || {}}
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
        </NextIntlClientProvider>
      </ConfigProvider>
    </>
  );
};

export default MyApp;
