import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import TokenBuyWidget from '../../components/TokenBuyWidget';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import PageNotFound from '../404';
import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const DEFAULT_TOKENS = 10;

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenCounterPage = ({ generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { nationality, tokens } = router.query;
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined ? Number(tokens) : DEFAULT_TOKENS,
  );

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
        ${__('token_sale_heading_token_counter')} - 
        ${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {__('token_sale_heading_token_counter')}
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
            {__('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

TokenCounterPage.getInitialProps = async () => {
  try {
    const generalRes = await api.get('/config/general').catch(() => {
      return null;
    });
    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default TokenCounterPage;
