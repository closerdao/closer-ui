import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import { useTranslations } from 'next-intl';
import { formatUnits } from 'viem';

import { MIN_CELO_FOR_GAS, TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { GeneralConfig } from '../../types';
import { TokenSale } from '../../types/api';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { getReserveTokenDisplay } from '../../utils/config.utils';
import { formatIntlNumberTwoDecimals } from '../../utils/currencyFormat';
import { logMetric } from '../../utils/metrics';
import {
  checkoutTokensFromSaleQuantity,
  fetchTokenSaleById,
  rawQuantityFromSale,
  waitForTokenSalePaidStatus,
} from '../../utils/tokenSale.helpers';
import {
  EURM_GAS_RESERVE,
  calculateEurmTopUpAmount,
  formatWidgetTokenAmount,
  safeParseTokenAmount,
} from '../../utils/tokenSalePayment';
import PageNotFound from '../not-found';

const MultiCurrencyPaymentModal = dynamic(
  () => import('../../components/token-sale/MultiCurrencyPaymentModal'),
  { ssr: false },
);

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
    getTotalCostRawWithoutWallet,
    getCeurBalanceWithoutWallet,
    isCeurApproved,
    approveCeur,
    isPending,
    isConfigReady,
  } = useBuyTokens();
  const [total, setTotal] = useState<number>(0);
  const [totalRaw, setTotalRaw] = useState<string>('0');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const { isAuthenticated, isLoading } = useAuth();
  const {
    account,
    hasSameConnectedAccount,
    isWalletConnected,
    isWalletReady,
    balanceCeurAvailable,
    balanceNativeAvailable,
  } = useContext(WalletState);
  const { connectWallet, switchNetwork, updateCeurBalance } =
    useContext(WalletDispatch);

  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingValidationTxHash, setPendingValidationTxHash] = useState<
    string | null
  >(null);

  const [isMetamaskLoading, setIsMetamaskLoading] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isSwapPreviewOpen, setIsSwapPreviewOpen] = useState(false);
  const [swapTopUpAmount, setSwapTopUpAmount] = useState<bigint>(0n);
  const [swapStatus, setSwapStatus] = useState<
    'idle' | 'executing' | 'settling' | 'ready' | 'failed'
  >('idle');

  const tokenCheckoutViewMetricRef = useRef<string | null>(null);
  useEffect(() => {
    if (!router.isReady || !saleIdTrimmed || saleLoading || !sale) return;
    if (tokenCheckoutViewMetricRef.current === saleIdTrimmed) return;
    tokenCheckoutViewMetricRef.current = saleIdTrimmed;
    const qty = tokensForCheckout ? parseInt(tokensForCheckout, 10) : 0;
    const pt = Number.isFinite(qty) ? qty : 0;
    void logMetric({
      event: 'token-checkout-viewed',
      category: 'token',
      value: 'checkout-view',
      point: pt,
    });
  }, [router.isReady, saleIdTrimmed, saleLoading, sale, tokensForCheckout]);

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
    if (!isConfigReady || !tokensForCheckout) return;

    let cancelled = false;
    void (async () => {
      const exactTotal = await getTotalCostRawWithoutWallet(tokensForCheckout);
      if (cancelled) return;
      setTotalRaw(exactTotal);
      setTotal(Number(formatUnits(BigInt(exactTotal), 18)));
    })();

    return () => {
      cancelled = true;
    };
  }, [isConfigReady, tokensForCheckout]);

  useEffect(() => {
    if (!isWalletReady || !isConfigReady || !tokensForCheckout) return;

    let cancelled = false;
    void (async () => {
      const isAllowanceSufficient = await isCeurApproved(tokensForCheckout);
      if (!cancelled) setIsApproved(isAllowanceSufficient);
    })();

    return () => {
      cancelled = true;
    };
  }, [isWalletReady, isConfigReady, tokensForCheckout, totalRaw]);

  useEffect(() => {
    if (tokensForCheckout) return;
    setTotal(0);
    setTotalRaw('0');
    setIsApproved(false);
  }, [tokensForCheckout]);

  const isCeloMainnet = Number(config.BLOCKCHAIN_NETWORK_ID) === 42220;
  const isMultiCurrencyFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE_MULTI_CURRENCY === 'true';
  const isMultiCurrencyEnabled = isMultiCurrencyFeatureEnabled && isCeloMainnet;
  const isLowNativeCelo =
    Number(balanceNativeAvailable ?? 0) < MIN_CELO_FOR_GAS;
  const needsEurmGas = isCeloMainnet && isLowNativeCelo;
  const totalAmountRaw = useMemo(() => {
    try {
      return BigInt(totalRaw || '0');
    } catch {
      return 0n;
    }
  }, [totalRaw]);
  const walletEurmBalanceRaw = useMemo(
    () => safeParseTokenAmount(balanceCeurAvailable),
    [balanceCeurAvailable],
  );
  const currentTopUpAmount = useMemo(
    () =>
      calculateEurmTopUpAmount({
        balance: walletEurmBalanceRaw,
        totalCost: totalAmountRaw,
        needsEurmGas,
      }),
    [needsEurmGas, totalAmountRaw, walletEurmBalanceRaw],
  );
  const requiredPurchaseBalance =
    totalAmountRaw + (needsEurmGas ? EURM_GAS_RESERVE : 0n);
  const hasPurchaseFunds = walletEurmBalanceRaw >= requiredPurchaseBalance;

  const handleOpenSwap = useCallback(async () => {
    setWeb3Error(null);
    if (!account || !isWalletConnected || !hasSameConnectedAccount) {
      await connectWallet();
      return;
    }
    if (currentTopUpAmount <= 0n) {
      setWeb3Error(t('token_sale_multi_currency_already_funded'));
      return;
    }

    setSwapTopUpAmount(currentTopUpAmount);
    setSwapStatus('idle');
    setIsSwapModalOpen(true);
    void logMetric({
      event: 'token-swap-opened',
      category: 'token',
      value: 'multi-currency',
    });
  }, [
    account,
    connectWallet,
    currentTopUpAmount,
    hasSameConnectedAccount,
    isWalletConnected,
    t,
  ]);

  const handleCloseSwap = useCallback(() => {
    if (swapStatus === 'executing' || swapStatus === 'settling') {
      void logMetric({
        event: 'token-swap-abandoned',
        category: 'token',
        value: swapStatus,
      });
    }
    setIsSwapModalOpen(false);
  }, [swapStatus]);

  const handleOpenSwapPreview = useCallback(async () => {
    setWeb3Error(null);
    if (!account || !isWalletConnected || !hasSameConnectedAccount) {
      await connectWallet();
      return;
    }

    setSwapStatus('idle');
    setIsSwapPreviewOpen(true);
    void logMetric({
      event: 'token-swap-preview-opened',
      category: 'token',
      value: 'multi-currency-preview',
    });
  }, [account, connectWallet, hasSameConnectedAccount, isWalletConnected]);

  const handleCloseSwapPreview = useCallback(() => {
    setIsSwapPreviewOpen(false);
  }, []);

  const handleSwapStarted = useCallback(() => {
    setSwapStatus('executing');
    void logMetric({
      event: 'token-swap-route-started',
      category: 'token',
      value: 'route-started',
    });
  }, []);

  const handleSwapFailed = useCallback(() => {
    setSwapStatus('failed');
    void logMetric({
      event: 'token-swap-route-failed',
      category: 'token',
      value: 'route-failed',
    });
  }, []);

  const handleSwapPreviewCompleted = useCallback(() => {
    setSwapStatus('ready');
    void logMetric({
      event: 'token-swap-preview-completed',
      category: 'token',
      value: 'mainnet-preview',
    });
  }, []);

  const handleSwapSourceSelected = useCallback(
    ({ chainId }: { chainId: number; tokenAddress: string }) => {
      void logMetric({
        event: 'token-swap-source-selected',
        category: 'token',
        value: String(chainId),
      });
    },
    [],
  );

  const handleSwapCompleted = useCallback(() => {
    if (!account || !tokensForCheckout) return;
    setSwapStatus('settling');
    void logMetric({
      event: 'token-swap-route-completed',
      category: 'token',
      value: 'route-completed',
    });

    void (async () => {
      await switchNetwork();

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const [latestCostRaw, latestBalanceRaw] = await Promise.all([
          getTotalCostRawWithoutWallet(tokensForCheckout),
          getCeurBalanceWithoutWallet(account),
        ]);
        const latestCost = BigInt(latestCostRaw || '0');
        const latestBalance = BigInt(latestBalanceRaw || '0');
        const requiredBalance =
          latestCost + (needsEurmGas ? EURM_GAS_RESERVE : 0n);

        if (latestBalance >= requiredBalance) {
          setTotalRaw(latestCostRaw);
          setTotal(Number(formatUnits(latestCost, 18)));
          setIsApproved(false);
          await updateCeurBalance();
          setSwapStatus('ready');
          setIsSwapModalOpen(false);
          void logMetric({
            event: 'token-swap-balance-settled',
            category: 'token',
            value: 'eurm-ready',
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3_000));
      }

      setSwapStatus('failed');
      setWeb3Error(t('token_sale_multi_currency_balance_pending'));
    })();
  }, [
    account,
    getCeurBalanceWithoutWallet,
    getTotalCostRawWithoutWallet,
    needsEurmGas,
    switchNetwork,
    t,
    tokensForCheckout,
    updateCeurBalance,
  ]);

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

    void logMetric({
      event: 'token-approval-started',
      category: 'token',
      value: 'approval-started',
      point: tokenPoint,
    });

    const { success, errorCode, userMessage, gasPayment } = await approveCeur(
      total,
      totalRaw,
    );
    if (success) {
      setIsApproved(true);
      void logMetric({
        event: 'approve',
        category: 'token',
        value: 'approve',
        point: tokenPoint,
      });
      if (gasPayment) {
        void logMetric({
          event: 'token-sale-gas-payment',
          category: 'token',
          value: gasPayment,
        });
      }
    } else {
      void logMetric({
        event: 'approve-error',
        category: 'token',
        value: 'approval-error',
        point: tokenPoint,
      });
      if (errorCode === 'EURM_FEE_UNSUPPORTED') {
        setWeb3Error(t('token_sale_eurm_gas_unsupported'));
      } else if (userMessage) {
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

    void logMetric({
      event: 'token-crypto-payment-started',
      category: 'token',
      value: 'payment-started',
      point: tokenPoint,
    });

    if (!normalizedSaleId) {
      void logMetric({
        event: 'purchase-error',
        category: 'token',
        value: 'error',
        point: tokenPoint,
      });
      setApiError(t('donate_create_invalid_response'));
      setIsMetamaskLoading(false);
      return;
    }
    const { success, txHash, errorCode, userMessage, gasPayment } =
      await buyTokens(tokensForCheckout);
    if (success) {
      if (gasPayment) {
        void logMetric({
          event: 'token-sale-gas-payment',
          category: 'token',
          value: gasPayment,
        });
      }
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
          category: 'token',
          value: 'validation-error',
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
      void logMetric({
        event: 'purchase-complete-crypto',
        category: 'token',
        value: 'sale',
        point: tokenPoint,
      });
      router.push(`/sale/${encodeURIComponent(normalizedSaleId)}`);
    } else {
      void logMetric({
        event: 'purchase-error',
        category: 'token',
        value: 'error',
        point: tokenPoint,
      });
      if (errorCode === 'EURM_FEE_UNSUPPORTED') {
        setWeb3Error(t('token_sale_eurm_gas_unsupported'));
      } else if (errorCode === 'MAX_SUPPLY') {
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
        category: 'token',
        value: 'validation-error',
        point: retryTokenPoint,
      });
      setApiError(t('donate_create_invalid_response'));
      setIsMetamaskLoading(false);
      return;
    }

    try {
      await api.post(
        `/sale/${encodeURIComponent(normalizedSaleId)}/confirm-token-sale`,
        {
          txHash: pendingValidationTxHash,
        },
      );
      setPendingValidationTxHash(null);
      await waitForTokenSalePaidStatus(normalizedSaleId);
      void logMetric({
        event: 'purchase-complete-crypto',
        category: 'token',
        value: 'sale',
        point: retryTokenPoint,
      });
      router.push(`/sale/${encodeURIComponent(normalizedSaleId)}`);
    } catch (error: unknown) {
      void logMetric({
        event: 'purchase-validation-error',
        category: 'token',
        value: 'validation-error',
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

        {isMultiCurrencyFeatureEnabled && (
          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div>
              <p className="font-medium text-amber-950">
                🧪 {t('token_sale_multi_currency_preview_heading')}
              </p>
              <p className="mt-1 text-sm text-amber-900">
                {t('token_sale_multi_currency_preview_description')}
              </p>
            </div>
            <Button
              variant="secondary"
              className="normal-case tracking-normal"
              onClick={handleOpenSwapPreview}
              isEnabled={!isPending && !isMetamaskLoading}
            >
              {!isWalletReady
                ? t('token_sale_multi_currency_connect_wallet')
                : t('token_sale_multi_currency_preview_button')}
            </Button>
          </div>
        )}

        {missingSaleId && (
          <div className="mt-6">
            <ErrorMessage
              error={t('token_sale_checkout_error_missing_sale_id')}
            />
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

          {isMultiCurrencyEnabled && totalAmountRaw > 0n && (
            <div>
              <Heading level={3} hasBorder={true}>
                💱 {t('token_sale_multi_currency_pay_with')}
              </Heading>
              <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {t('token_sale_multi_currency_direct_label', {
                        reserveToken,
                      })}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('token_sale_multi_currency_description', {
                        reserveToken,
                      })}
                    </p>
                  </div>
                  {isWalletReady && (
                    <span className="shrink-0 text-sm text-gray-600">
                      {formatIntlNumberTwoDecimals(
                        Number(balanceCeurAvailable ?? 0),
                        router.locale || undefined,
                      )}{' '}
                      {reserveToken}
                    </span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  className="normal-case tracking-normal"
                  onClick={handleOpenSwap}
                  isEnabled={
                    !isPending &&
                    !isMetamaskLoading &&
                    (!isWalletReady || currentTopUpAmount > 0n)
                  }
                >
                  {!isWalletReady
                    ? t('token_sale_multi_currency_connect_wallet')
                    : currentTopUpAmount > 0n
                    ? t('token_sale_multi_currency_other_crypto_button')
                    : t('token_sale_multi_currency_already_funded')}
                </Button>

                {isWalletReady && currentTopUpAmount > 0n && (
                  <p className="text-center text-xs text-gray-500">
                    {t('token_sale_multi_currency_top_up_amount', {
                      amount: formatWidgetTokenAmount(currentTopUpAmount),
                      reserveToken,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {isWalletEnabled &&
            isWalletReady &&
            (isLowNativeCelo || walletEurmBalanceRaw < totalAmountRaw) && (
              <div className="flex flex-col gap-4">
                {isLowNativeCelo && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-800"
                    role="alert"
                  >
                    <span
                      className="text-amber-500 text-xl shrink-0"
                      aria-hidden
                    >
                      ⚠️
                    </span>
                    <p className="text-sm font-medium">
                      {isCeloMainnet
                        ? t('token_sale_eurm_gas_fallback', { reserveToken })
                        : t('insufficient_celo_for_gas')}
                    </p>
                  </div>
                )}
                {totalAmountRaw > 0n &&
                  walletEurmBalanceRaw < totalAmountRaw && (
                    <div
                      className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-800"
                      role="alert"
                    >
                      <span
                        className="text-amber-500 text-xl shrink-0"
                        aria-hidden
                      >
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
                      (isWalletReady && hasPurchaseFunds))
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
                    isWalletReady &&
                    hasPurchaseFunds
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
      {isSwapModalOpen && account && (
        <MultiCurrencyPaymentModal
          account={account}
          locale={router.locale}
          toAmount={formatWidgetTokenAmount(swapTopUpAmount)}
          onClose={handleCloseSwap}
          onConnect={() => {
            void connectWallet();
          }}
          onRouteStarted={handleSwapStarted}
          onRouteCompleted={handleSwapCompleted}
          onRouteFailed={handleSwapFailed}
          onSourceSelected={handleSwapSourceSelected}
        />
      )}
      {isSwapPreviewOpen && account && (
        <MultiCurrencyPaymentModal
          account={account}
          locale={router.locale}
          previewMode
          toAmount="1"
          onClose={handleCloseSwapPreview}
          onConnect={() => {
            void connectWallet();
          }}
          onRouteStarted={handleSwapStarted}
          onRouteCompleted={handleSwapPreviewCompleted}
          onRouteFailed={handleSwapFailed}
          onSourceSelected={handleSwapSourceSelected}
        />
      )}
    </>
  );
};

export default TokenSaleCheckoutPage;
