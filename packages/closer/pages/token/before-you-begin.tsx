import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import TokenBuyWidget from '../../components/TokenBuyWidget';
import { BackButton, Button, ErrorMessage, Heading, ProgressBar } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { SALES_CONFIG } from '../../constants/shared.constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import PageNotFound from '../not-found';

const DEFAULT_TOKENS = 10;
const { MAX_TOKENS_PER_TRANSACTION } = SALES_CONFIG;

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenSaleBeforeYouBeginPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();

  useSalePaidRedirect();

  const { isLoading, user } = useAuth();

  const { tokens } = router.query;

  const isFinanceTokenEnabled =
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined
      ? Math.min(
          MAX_TOKENS_PER_TRANSACTION,
          Math.max(1, Number(tokens)),
        )
      : DEFAULT_TOKENS,
  );
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [tokenSaleType, setTokenSaleType] = useState<
    'fiat' | 'crypto' | 'finance'
  >(isFinanceTokenEnabled ? 'fiat' : 'crypto');
  const [isCalculationPending, setIsCalculationPending] = useState(false);
  const [createSaleError, setCreateSaleError] = useState<string | null>(null);
  const [isCreateSaleLoading, setIsCreateSaleLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading]);

  const handleNext = async () => {
    if (tokenSaleType === 'finance') {
      void logMetric({
        event: 'continue-before-you-begin-finance',
        value: 'token-sale',
      });
      router.push('/token/finance');
      return;
    }

    setCreateSaleError(null);
    setIsCreateSaleLoading(true);

    let saleId = '';

    try {
      const paymentMethod = tokenSaleType === 'fiat' ? 'bank' : 'crypto';
      const { data } = await api.post('/sale/init', {
        type: 'token',
        paymentMethod,
        quantity: tokensToBuy,
      });
      const rawResults = data?.results;
      const results =
        rawResults &&
        typeof rawResults === 'object' &&
        'value' in rawResults &&
        (rawResults as { value: unknown }).value !== undefined
          ? (rawResults as { value: unknown }).value
          : rawResults;
      saleId = (results as { saleId?: string })?.saleId || '';
      if (!saleId) {
        void logMetric({
          event: 'sale-init-error',
          value: 'token-sale',
          point: tokensToBuy,
        });
        setCreateSaleError(t('donate_create_invalid_response'));
        return;
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        void logMetric({
          event: 'sale-init-error',
          value: 'token-sale',
          point: tokensToBuy,
        });
        router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
        return;
      }
      void logMetric({
        event: 'sale-init-error',
        value: 'token-sale',
        point: tokensToBuy,
      });
      setCreateSaleError(parseMessageFromError(error));
      return;
    } finally {
      setIsCreateSaleLoading(false);
    }

    if (tokenSaleType === 'fiat') {
      void logMetric({
        event: 'continue-before-you-begin-fiat',
        value: 'token-sale',
        point: tokensToBuy,
      });
      router.push(
        `/token/nationality?tokenSaleType=fiat&saleId=${encodeURIComponent(saleId)}`,
      );
    } else if (tokenSaleType === 'crypto') {
      void logMetric({
        event: 'continue-before-you-begin-crypto',
        value: 'token-sale',
        point: tokensToBuy,
      });
      router.push(
        `/token/checklist-crypto?saleId=${encodeURIComponent(saleId)}`,
      );
    }
  };

  const goBack = async () => {
    router.push('/token');
  };

  // Check if the form is ready to proceed
  const isFormReady = tokensToSpend > 0 && !isCalculationPending && !isCreateSaleLoading;

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
                setIsCalculationPending={setIsCalculationPending}
              />
            </fieldset>
            {/* <div className="flex flex-col gap-4">
              <p>{t('token_sale_before_you_begin_text_1')}</p>
              <p>{t('token_sale_before_you_begin_text_2')}</p>
              <p>{t('token_sale_before_you_begin_text_3')}</p>
            </div> */}
          </div>

          {isFinanceTokenEnabled && (
            <div>
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
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="payFinance"
                    name="tokenSaleType"
                    className="w-4 h-4"
                    checked={tokenSaleType === 'finance'}
                    onChange={() => setTokenSaleType('finance')}
                  />
                  <label htmlFor="payFinance" className="whitespace-nowrap">
                    {t('token_sale_heading_pay_finance')}
                  </label>
                </div>
              </div>
            </div>
          )}

          <Button
            className="mt-12"
            onClick={handleNext}
            isEnabled={isFormReady}
            isLoading={isCreateSaleLoading}
          >
            {isCalculationPending
              ? t('token_sale_button_calculating') || 'Calculating...'
              : t('token_sale_button_continue')}
          </Button>
          {createSaleError && <ErrorMessage error={createSaleError} />}
        </main>
      </div>
    </>
  );
};

export default TokenSaleBeforeYouBeginPage;
