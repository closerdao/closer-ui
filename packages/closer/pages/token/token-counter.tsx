import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef, useState } from 'react';

import TokenBuyWidget from '../../components/TokenBuyWidget';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const DEFAULT_TOKENS = 10;

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenCounterPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { nationality, tokens } = router.query;
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);
  const hasComponentRendered = useRef(false);

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined ? Number(tokens) : DEFAULT_TOKENS,
  );

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'use-calculator',
            value: 'token-sale',
            point: 0,
            category: 'engagement',
          });

        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (tokens && tokens !== 'undefined') {
      setTokensToBuy(Number(tokens));
    } else {
      setTokensToBuy(DEFAULT_TOKENS);
    }
  }, [router]);

  const goBack = async () => {
    if (user && user.kycPassed) {
      router.push('/token/before-you-begin');
    } else {
      router.push('/token/nationality');
    }
  };

  const handleNext = async () => {
    if (user && user.kycPassed) {
      router.push(
        `/token/checkout?tokens=${tokensToBuy < 1 ? 1 : tokensToBuy}`,
      );
    } else {
      router.push(
        `/token/your-info?nationality=${nationality}&tokens=${
          tokensToBuy < 1 ? 1 : tokensToBuy
        }`,
      );
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' || !isWalletReady) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_token_counter')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {t('token_sale_heading_token_counter')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <fieldset className="flex flex-col gap-12 min-h-[250px]">
            <TokenBuyWidget
              tokensToBuy={tokensToBuy}
              setTokensToBuy={setTokensToBuy}
            />
          </fieldset>
          <Button
            onClick={handleNext}
            isEnabled={Boolean(tokensToBuy)}
            className="mt-10"
          >
            {t('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

TokenCounterPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default TokenCounterPage;
