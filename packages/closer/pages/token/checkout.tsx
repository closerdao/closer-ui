import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useMemo, useState } from 'react';

import Wallet from '../../components/Wallet';
import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
  Row,
  Spinner,
} from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MIN_CELO_FOR_GAS, TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import { formatIntlNumberTwoDecimals } from '../../utils/currencyFormat';
import { getReserveTokenDisplay } from '../../utils/config.utils';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenSaleCheckoutPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { tokens, saleId } = router.query || { tokens: '33' };

  useSalePaidRedirect();

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const config = useConfig() || {};
  const reserveToken = getReserveTokenDisplay(config);
  const {
    buyTokens,
    getTotalCost,
    isCeurApproved,
    approveCeur,
    isPending,
    isConfigReady,
  } = useBuyTokens();
  const [total, setTotal] = useState<number>(0);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const { isAuthenticated, isLoading } = useAuth();
  const { isWalletReady, balanceCeurAvailable, balanceCeloAvailable } =
    useContext(WalletState);

  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingValidationTxHash, setPendingValidationTxHash] = useState<string | null>(null);

  const [isMetamaskLoading, setIsMetamaskLoading] = useState(false);

  const formattedUnitPrice = useMemo(() => {
    const qty = parseInt(tokens as string, 10);
    const n = qty > 0 ? total / qty : 0;
    return formatIntlNumberTwoDecimals(
      Number.isFinite(n) ? n : 0,
      router.locale || undefined,
    );
  }, [total, tokens, router.locale]);

  const formattedTotalAmount = useMemo(
    () => formatIntlNumberTwoDecimals(total, router.locale || undefined),
    [total, router.locale],
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isWalletReady && isConfigReady) {
      (async () => {
        const totalCost = await getTotalCost(tokens as string);
        setTotal(totalCost);
        const isAllowanceSufficient = await isCeurApproved(tokens as string);
        setIsApproved(isAllowanceSufficient);
      })();
    }
  }, [isWalletReady, isConfigReady]);

  const goBack = async () => {
    router.push(
      `/token/nationality?tokenSaleType=crypto&tokens=${encodeURIComponent(
        String(tokens || ''),
      )}&saleId=${encodeURIComponent(String(saleId || ''))}`,
    );
  };

  const handleApprovalTx = async () => {
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);

    const purchaseQty = parseInt(String(tokens ?? ''), 10);
    const tokenPoint = Number.isFinite(purchaseQty) ? purchaseQty : 0;

    const { success, errorCode, userMessage } = await approveCeur(total);
    if (success) {
      setIsApproved(true);
      void logMetric({ event: 'approve', value: 'token-sale', point: tokenPoint });
    } else {
      void logMetric({
        event: 'approve-error',
        value: 'token-sale',
        point: tokenPoint,
      });
      if (userMessage) {
        setWeb3Error(
          t('token_sale_approval_error_reason', {
            reason: userMessage,
            reserveToken,
          }),
        );
      } else {
        setWeb3Error(t('token_sale_approval_error', { reserveToken }));
      }
    }
    setIsMetamaskLoading(false);
  };

  const handlePurchaseTx = async () => {
    setWeb3Error(null);
    setApiError(null);
    setPendingValidationTxHash(null);
    setIsMetamaskLoading(true);
    const normalizedSaleId = String(saleId || '').trim();
    const purchaseQty = parseInt(String(tokens ?? ''), 10);
    const tokenPoint = Number.isFinite(purchaseQty) ? purchaseQty : 0;

    if (!normalizedSaleId) {
      void logMetric({
        event: 'purchase-error',
        value: 'token-sale',
        point: tokenPoint,
      });
      setApiError(t('donate_create_invalid_response'));
      setIsMetamaskLoading(false);
      return;
    }
    const { success, txHash, errorCode, userMessage } = await buyTokens(
      tokens as string,
    );
    if (success) {
      try {
        await api.post(
          `/sale/${encodeURIComponent(normalizedSaleId)}/confirm-token-sale`,
          {
            txHash,
          },
        );
      } catch (error: unknown) {
        void logMetric({
          event: 'purchase-validation-error',
          value: 'token-sale',
          point: tokenPoint,
        });
        setPendingValidationTxHash(txHash || null);
        setApiError(
          t('token_sale_validation_failed_error', {
            error_details: parseMessageFromError(error),
          }),
        );
        setIsMetamaskLoading(false);
        return;
      }

      await logMetric({
        event: 'purchase-complete-crypto',
        value: 'token-sale',
        point: tokenPoint,
      });
      router.push(`/sale/${encodeURIComponent(normalizedSaleId)}`);
    } else {
      void logMetric({
        event: 'purchase-error',
        value: 'token-sale',
        point: tokenPoint,
      });
      if (errorCode === 'MAX_SUPPLY') {
        setWeb3Error(t('token_sale_buy_error_max_supply'));
      } else if (errorCode === 'INSUFFICIENT_BALANCE') {
        setWeb3Error(
          t('token_sale_buy_error_insufficient_balance', { reserveToken }),
        );
      } else if (userMessage) {
        setWeb3Error(
          t('token_sale_buy_error_reason', {
            reason: userMessage,
            reserveToken,
          }),
        );
      } else {
        setWeb3Error(t('token_sale_buy_error', { reserveToken }));
      }
      setIsMetamaskLoading(false);
    }
  };

  const handleRetrySaleValidation = async () => {
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);

    const normalizedSaleId = String(saleId || '').trim();
    const retryQty = parseInt(String(tokens ?? ''), 10);
    const retryTokenPoint = Number.isFinite(retryQty) ? retryQty : 0;

    if (!normalizedSaleId || !pendingValidationTxHash) {
      void logMetric({
        event: 'purchase-validation-error',
        value: 'token-sale',
        point: retryTokenPoint,
      });
      setApiError(t('donate_create_invalid_response'));
      setIsMetamaskLoading(false);
      return;
    }

    try {
      await api.post(`/sale/${encodeURIComponent(normalizedSaleId)}/confirm-token-sale`, {
        txHash: pendingValidationTxHash,
      });
      setPendingValidationTxHash(null);
      await logMetric({
        event: 'purchase-complete-crypto',
        value: 'token-sale',
        point: retryTokenPoint,
      });
      router.push(`/sale/${encodeURIComponent(normalizedSaleId)}`);
    } catch (error: unknown) {
      void logMetric({
        event: 'purchase-validation-error',
        value: 'token-sale',
        point: retryTokenPoint,
      });
      setApiError(
        t('token_sale_validation_failed_error', {
          error_details: parseMessageFromError(error),
        }),
      );
    } finally {
      setIsMetamaskLoading(false);
    }
  };

  const handleEditAmount = () => {
    router.push(`/token/before-you-begin?tokens=${tokens}&saleId=${saleId}`);
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_checkout')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          💰 {t('token_sale_heading_checkout')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        {isWalletEnabled && (
          <div className="mt-12 flex flex-col gap-4">
            <Wallet />
            {isWalletReady &&
              Number(balanceCeloAvailable ?? 0) < MIN_CELO_FOR_GAS && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-800"
                  role="alert"
                >
                  <span className="text-amber-500 text-xl shrink-0" aria-hidden>
                    ⚠️
                  </span>
                  <p className="text-sm font-medium">
                    {t('insufficient_celo_for_gas')}
                  </p>
                </div>
              )}
            {isWalletReady &&
              total > 0 &&
              Number(balanceCeurAvailable ?? 0) < total && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-800"
                  role="alert"
                >
                  <span className="text-amber-500 text-xl shrink-0" aria-hidden>
                    ⚠️
                  </span>
                  <p className="text-sm font-medium">
                    {t('token_sale_not_enough_reserve_for_purchase', {
                      reserveToken,
                    })}
                  </p>
                </div>
              )}
          </div>
        )}

        <main className="pt-14 pb-24 flex flex-col gap-12">
          <div className="">
            <Heading level={3} hasBorder={true}>
              ➕ {t('token_sale_checkout_total')}
            </Heading>
            <div className="flex flex-col gap-6">
              <Row
                rowKey={t('token_sale_token_symbol')}
                value={tokens?.toString()}
                additionalInfo={`1 ${t(
                  'token_sale_token_symbol',
                )} = ${formattedUnitPrice} ${reserveToken}`}
              />
              <Row
                rowKey={t('token_sale_checkout_total')}
                value={`${t('token_sale_source_token', {
                  reserveToken,
                })} ${formattedTotalAmount} `}
                additionalInfo={t('token_sale_ceur_disclaimer', {
                  reserveToken,
                })}
              />
            </div>
          </div>

          {isApproved ? (
            <Button
              className="normal-case tracking-normal"
              onClick={pendingValidationTxHash ? handleRetrySaleValidation : handlePurchaseTx}
              isEnabled={
                !isPending &&
                !isMetamaskLoading &&
                (pendingValidationTxHash !== null || balanceCeurAvailable > total)
              }
            >
              {isPending || isMetamaskLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  {t('token_sale_checkout_button_pending_transaction')}
                </div>
              ) : (
                pendingValidationTxHash
                  ? t('token_sale_checkout_button_retry_validation')
                  : t('token_sale_checkout_button_purchase_transaction')
              )}
            </Button>
          ) : (
            <Button
              className="normal-case tracking-normal"
              onClick={handleApprovalTx}
              isEnabled={
                !isPending && !isMetamaskLoading && balanceCeurAvailable > total
              }
            >
              {isPending || isMetamaskLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  {t('token_sale_checkout_button_pending_transaction')}
                </div>
              ) : (
                t('token_sale_checkout_button_approve_transaction', {
                  reserveToken,
                })
              )}
            </Button>
          )}
          {web3Error && <ErrorMessage error={web3Error} />}
          {apiError && <ErrorMessage error={apiError} />}
        </main>
      </div>
    </>
  );
};

TokenSaleCheckoutPage.getInitialProps = async (context: NextPageContext) => {
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

export default TokenSaleCheckoutPage;
