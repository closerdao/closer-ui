import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useRef, useState } from 'react';

import { ErrorBoundary, Layout } from '@/components';

import AcceptCookies from 'closer/components/AcceptCookies';
import PushNotificationModal from 'closer/components/PushNotificationModal';

import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  api,
  getConfig,
} from 'closer';
import { blockchainConfig } from 'closer/config_blockchain';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import rbacDefaultConfig from 'closer/constants/rbac';
import { NewsletterProvider } from 'closer/contexts/newsletter';
import { PushNotificationProvider } from 'closer/contexts/push-notifications';
import { WalletProvider } from 'closer/contexts/wallet';
import {
  mergeGeneralConfigWithDefaults,
  prepareGeneralConfig,
} from 'closer/utils/app.helpers';
import { getAppConfigFromEnv } from 'closer/utils/appConfigFromEnv';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import '../styles/index.css';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

const MyApp = ({ Component, pageProps }: AppOwnProps) => {
  const defaultGeneralConfig = mergeGeneralConfigWithDefaults(null);
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;
  const mountedRef = useRef(false);
  const [config, setConfig] = useState<any>(() => ({
    ...prepareGeneralConfig(defaultGeneralConfig),
    _configLoaded: false,
  }));
  const [rbacConfig, setRBACConfig] = useState<any>(rbacDefaultConfig);
  const [isLocalhost, setIsLocalhost] = useState(true); // Default to true to prevent initial flash
  const [isEnvironmentChecked, setIsEnvironmentChecked] = useState(false);

  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, [referral]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;

      const isRunningLocally =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');

      setIsLocalhost(isRunningLocally);
      setIsEnvironmentChecked(true);
    }

    (async () => {
      try {
        const keyedConfig = await getConfig(api);
        const mergedGeneral = mergeGeneralConfigWithDefaults(keyedConfig.general);
        setConfig({
          ...prepareGeneralConfig(mergedGeneral),
          ...keyedConfig,
          _configLoaded: true,
        });
        setRBACConfig(keyedConfig.rbac || {});
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const shouldShowWidget = !isLocalhost && isEnvironmentChecked;

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

      {/* TDF specific chatbot widget */}
      {shouldShowWidget && (
        <>
          <Script
            id="gptconfig"
            dangerouslySetInnerHTML={{
              __html: `window.GPTTConfig = {
                uuid: "a9d70d04c6b64f328acd966ad87e4fb4",
              };`,
            }}
          />
          <Script src="https://app.gpt-trainer.com/widget-asset.min.js" defer />
        </>
      )}

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
          ...getAppConfigFromEnv(),
          rbacConfig,
        }}
      >
        <ErrorBoundary>
          <NextIntlClientProvider
            locale={router.locale || 'en'}
            messages={pageProps.messages || {}}
            timeZone={
              config?.TIME_ZONE ||
              process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ||
              getAppConfigFromEnv().DEFAULT_TIMEZONE
            }
            onError={(error) => {
              console.error('Error in NextIntlClientProvider', error);
            }}
          >
            <AuthProvider>
              <PlatformProvider>
                <WalletProvider>
                  <PushNotificationProvider>
                    <NewsletterProvider>
                      <Layout>
                        <GoogleAnalytics trackPageViews />
                        <PushNotificationModal />
                        <Component {...pageProps} config={config} />
                      </Layout>
                    </NewsletterProvider>
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
