import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import TokenBuyWidget from '../../components/TokenBuyWidget';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
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

const TokenSaleBeforeYouBeginPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();

  const { isLoading, user } = useAuth();

  const { tokens } = router.query;

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined ? Number(tokens) : DEFAULT_TOKENS,
  );
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [tokenSaleType, setTokenSaleType] = useState<'fiat' | 'crypto'>('fiat');

  const hasComponentRendered = useRef(false);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'open-flow',
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
    if (!isLoading && !user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading]);

  const handleNext = async () => {
    if (tokenSaleType === 'fiat') {
      if (user && user.kycPassed === true) {
        router.push(
          `/token/bank-transfer?tokens=${encodeURIComponent(
            tokensToBuy,
          )}&totalFiat=${encodeURIComponent(tokensToSpend)}`,
        );
      } else {
        router.push(
          `/token/nationality?tokenSaleType=fiat&tokens=${encodeURIComponent(
            tokensToBuy,
          )}&totalFiat=${encodeURIComponent(tokensToSpend)}`,
        );
      }
    } else if (tokenSaleType === 'crypto') {
      if (user && user.kycPassed === true) {
        router.push(
          `/token/checkout?tokens=${encodeURIComponent(tokensToBuy)}`,
        );
      } else {
        router.push(
          `/token/nationality?tokenSaleType=crypto&tokens=${encodeURIComponent(
            tokensToBuy,
          )}`,
        );
      }
    }
  };

  const goBack = async () => {
    router.push('/token');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_before_you_begin')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {t('token_sale_heading_before_you_begin')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className=" pb-24 flex flex-col gap-4">
          <div>
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_heading_token_counter')}
            </Heading>
            <fieldset className="flex flex-col gap-12 min-h-[250px]">
              <TokenBuyWidget
                tokensToBuy={tokensToBuy}
                setTokensToBuy={setTokensToBuy}
                tokensToSpend={tokensToSpend}
                setTokensToSpend={setTokensToSpend}
              />
            </fieldset>
            <div className="flex flex-col gap-4">
              <p>{t('token_sale_before_you_begin_text_1')}</p>
              <p>{t('token_sale_before_you_begin_text_2')}</p>
              <p>{t('token_sale_before_you_begin_text_3')}</p>
            </div>
          </div>
          <div className="pb-12">
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_heading_how')}
            </Heading>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="payFiat"
                  name="tokenSaleType"
                  className="w-4 h-4"
                  checked={tokenSaleType === 'fiat'}
                  onChange={() => setTokenSaleType('fiat')}
                />
                <label htmlFor="payFiat" className="whitespace-nowrap">
                  {t('token_sale_heading_pay_bank_transfer')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="payCrypto"
                  name="tokenSaleType"
                  className="w-4 h-4"
                  checked={tokenSaleType === 'crypto'}
                  onChange={() => setTokenSaleType('crypto')}
                />
                <label htmlFor="payCrypto" className="whitespace-nowrap">
                  {t('token_sale_heading_pay_bank_crypto')}
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleNext} isEnabled={Boolean(tokensToSpend)}>
            {t('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

TokenSaleBeforeYouBeginPage.getInitialProps = async (
  context: NextPageContext,
) => {
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

export default TokenSaleBeforeYouBeginPage;
