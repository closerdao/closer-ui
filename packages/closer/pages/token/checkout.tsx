import Head from 'next/head';
import Link from 'next/link';
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
import { TokenSale } from '../../types/api';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  checkoutTokensFromSaleQuantity,
  fetchTokenSaleById,
  rawQuantityFromSale,
  waitForTokenSalePaidStatus,
} from '../../utils/tokenSale.helpers';
import { logMetric } from '../../utils/metrics';
import { formatIntlNumberTwoDecimals } from '../../utils/currencyFormat';
import { getReserveTokenDisplay } from '../../utils/config.utils';
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
  const { tokens: tokensQuery, saleId: saleIdQuery } = router.query;

  const [sale, setSale] = useState<TokenSale | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleFetchError, setSaleFetchError] = useState<string | null>(null);

  const saleIdTrimmed = useMemo(() => {
    const s = saleIdQuery;
    if (s === undefined || s === null) return '';
    const raw = Array.isArray(s) ? s[0] : s;
    return String(raw ?? '').trim();
  }, [saleIdQuery]);

  const tokensForCheckout = useMemo(
    () => checkoutTokensFromSaleQuantity(sale),
    [sale],
  );

  const rawQty = useMemo(() => rawQuantityFromSale(sale), [sale]);

  const missingSaleId = router.isReady && !saleIdTrimmed;
  const isZeroTokens =
    router.isReady &&
    !saleLoading &&
    !!sale &&
    Number.isFinite(rawQty) &&
    rawQty === 0;
  const showCheckoutActions =
    Boolean(tokensForCheckout) &&
    !missingSaleId &&
    !saleFetchError &&
    !saleLoading;

  const startSaleFlowHref = useMemo(() => {
    const base = '/token/before-you-begin';
    if (!saleIdTrimmed) return base;
    return `${base}?saleId=${encodeURIComponent(saleIdTrimmed)}`;
  }, [saleIdTrimmed]);

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
    const qty = tokensForCheckout ? parseInt(tokensForCheckout, 10) : 0;
    const n = qty > 0 ? total / qty : 0;
    return formatIntlNumberTwoDecimals(
      Number.isFinite(n) ? n : 0,
      router.locale || undefined,
    );
  }, [total, tokensForCheckout, router.locale]);

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
    if (!router.isReady || tokensQuery === undefined || !saleIdTrimmed) return;
    router.replace(
      {
        pathname: router.pathname,
        query: { saleId: saleIdTrimmed },
      },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, tokensQuery, saleIdTrimmed, router.pathname]);

  useEffect(() => {
    if (!router.isReady || !saleIdTrimmed) {
      setSale(null);
      setSaleFetchError(null);
      setSaleLoading(false);
      return;
    }
    let cancelled = false;
    setSaleLoading(true);
    setSaleFetchError(null);
    (async () => {
      const fetched = await fetchTokenSaleById(saleIdTrimmed);
      if (cancelled) return;
      if (!fetched) {
        setSale(null);
        setSaleFetchError(t('sale_summary_not_found'));
      } else {
        setSale(fetched);
      }
      setSaleLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, saleIdTrimmed, t]);

  useEffect(() => {
    if (!isWalletReady || !isConfigReady || !tokensForCheckout) {
      return;
    }
    (async () => {
      const totalCost = await getTotalCost(tokensForCheckout);
      setTotal(totalCost);
      const isAllowanceSufficient = await isCeurApproved(tokensForCheckout);
      setIsApproved(isAllowanceSufficient);
    })();
  }, [isWalletReady, isConfigReady, tokensForCheckout]);

  useEffect(() => {
    if (tokensForCheckout) return;
    setTotal(0);
    setIsApproved(false);
  }, [tokensForCheckout]);

  const goBack = async () => {
    router.push(
      `/token/nationality?tokenSaleType=crypto&saleId=${encodeURIComponent(
        saleIdTrimmed,
      )}`,
    );
  };

  const handleApprovalTx = async () => {
    if (!tokensForCheckout) return;
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);

    const purchaseQty = parseInt(tokensForCheckout, 10);
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
    if (!tokensForCheckout) return;
    setWeb3Error(null);
    setApiError(null);
    setPendingValidationTxHash(null);
    setIsMetamaskLoading(true);
    const normalizedSaleId = saleIdTrimmed;
    const purchaseQty = parseInt(tokensForCheckout, 10);
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
    const { success, txHash, errorCode, userMessage } =
      await buyTokens(tokensForCheckout);
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

      await waitForTokenSalePaidStatus(normalizedSaleId);
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
    if (!tokensForCheckout) return;
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);

    const normalizedSaleId = saleIdTrimmed;
    const retryQty = parseInt(tokensForCheckout, 10);
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
      await waitForTokenSalePaidStatus(normalizedSaleId);
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
    if (!saleIdTrimmed) return;
    router.push(
      `/token/before-you-begin?saleId=${encodeURIComponent(saleIdTrimmed)}`,
    );
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  if (!router.isReady) {
    return (
      <>
        <Head>
          <title>{`
        ${t('token_sale_heading_checkout')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
        </Head>
        <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex justify-center pt-24">
          <Spinner />
        </div>
      </>
    );
  }

  if (saleIdTrimmed && saleLoading) {
    return (
      <>
        <Head>
          <title>{`
        ${t('token_sale_heading_checkout')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
        </Head>
        <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex justify-center pt-24">
          <Spinner />
        </div>
      </>
    );
  }

  const tokensDisplayValue =
    tokensForCheckout ??
    (sale && Number.isFinite(rawQty) ? String(rawQty) : '');

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

        {missingSaleId && (
          <div className="mt-6">
            <ErrorMessage error={t('token_sale_checkout_error_missing_sale_id')} />
          </div>
        )}
        {saleFetchError && (
          <div className="mt-6">
            <ErrorMessage error={saleFetchError} />
          </div>
        )}
        {isZeroTokens && (
          <div className="mt-6 flex flex-col gap-3">
            <ErrorMessage error={t('token_sale_checkout_error_zero_tokens')} />
            <Link
              href={startSaleFlowHref}
              className="text-accent hover:underline font-medium"
            >
              {t('token_sale_checkout_start_sale_flow_link')}
            </Link>
          </div>
        )}

        <main className="pb-24 flex flex-col gap-12">
          <div className="">
            <Heading level={3} hasBorder={true}>
              ➕ {t('token_sale_checkout_total')}
            </Heading>
            <div className="flex flex-col gap-6">
              <Row
                rowKey={t('token_sale_token_symbol')}
                value={tokensDisplayValue}
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

          {isWalletEnabled &&
            isWalletReady &&
            (Number(balanceCeloAvailable ?? 0) < MIN_CELO_FOR_GAS ||
              (total > 0 &&
                Number(balanceCeurAvailable ?? 0) < total)) && (
              <div className="flex flex-col gap-4">
                {Number(balanceCeloAvailable ?? 0) < MIN_CELO_FOR_GAS && (
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
                {total > 0 &&
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

          {showCheckoutActions && (
            <div className="flex flex-col gap-3">
              {web3Error && <ErrorMessage error={web3Error} />}
              {apiError && <ErrorMessage error={apiError} />}
              {isApproved ? (
                <Button
                  className="normal-case tracking-normal"
                  onClick={
                    pendingValidationTxHash
                      ? handleRetrySaleValidation
                      : handlePurchaseTx
                  }
                  isEnabled={
                    !isPending &&
                    !isMetamaskLoading &&
                    (pendingValidationTxHash !== null ||
                      balanceCeurAvailable > total)
                  }
                >
                  {isPending || isMetamaskLoading ? (
                    <div className="flex gap-2 items-center">
                      <Spinner />
                      {t('token_sale_checkout_button_pending_transaction')}
                    </div>
                  ) : pendingValidationTxHash ? (
                    t('token_sale_checkout_button_retry_validation')
                  ) : (
                    t('token_sale_checkout_button_purchase_transaction')
                  )}
                </Button>
              ) : (
                <Button
                  className="normal-case tracking-normal"
                  onClick={handleApprovalTx}
                  isEnabled={
                    !isPending &&
                    !isMetamaskLoading &&
                    balanceCeurAvailable > total
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
            </div>
          )}
          {isWalletEnabled && <Wallet />}
        </main>
      </div>
    </>
  );
};

TokenSaleCheckoutPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const generalRes = await api.get('/config/general').catch(() => null)

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

export default TokenSaleCheckoutPage;
