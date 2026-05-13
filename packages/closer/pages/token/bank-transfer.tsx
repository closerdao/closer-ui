import Head from 'next/head';
import { useRouter } from 'next/router';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  BackButton,
  Button,
  Checkbox,
  ErrorMessage,
  Heading,
  Input,
  ProgressBar,
  Spinner,
} from '../../components/ui';

import { isValid } from 'iban-ts';
import { useTranslations } from 'next-intl';

import {
  TOKEN_PURCHASE_TERMS_DOC_URL,
  TOKEN_SALE_STEPS_BANK_TRANSFER,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { GeneralConfig } from '../../types';
import { TokenSale } from '../../types/api';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { formatIntlNumberTwoDecimals } from '../../utils/currencyFormat';
import { logMetric } from '../../utils/metrics';
import { fetchTokenSaleById } from '../../utils/tokenSale.helpers';
import PageNotFound from '../not-found';

const firstQueryString = (value: string | string[] | undefined): string =>
  typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value[0] ?? ''
      : '';

interface Props {
  generalConfig: GeneralConfig | null;
}

const BankTransferPage = ({ generalConfig }: Props) => {
  const t = useTranslations();

  const router = useRouter();
  const { tokens: legacyTokens, totalFiat: legacyTotalFiat, saleId } =
    router.query;
  const resolvedSaleId = firstQueryString(saleId);
  const hasValidSaleId = resolvedSaleId.trim().length > 0;

  const [sale, setSale] = useState<TokenSale | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleFetchError, setSaleFetchError] = useState<string | null>(null);

  useSalePaidRedirect();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { isAuthenticated, isLoading, user } = useAuth();

  const [ibanNumber, setIbanNumber] = useState('');
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isTokenTermsAccepted, setIsTokenTermsAccepted] = useState(false);
  const [existingCharges, setExistingCharges] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fiatCheckoutViewMetricRef = useRef<string | null>(null);
  useEffect(() => {
    if (!router.isReady || !hasValidSaleId || saleLoading || !sale) return;
    const sid = resolvedSaleId.trim();
    if (!sid || fiatCheckoutViewMetricRef.current === sid) return;
    fiatCheckoutViewMetricRef.current = sid;
    const rawQty = sale?.quantity;
    const pt =
      typeof rawQty === 'number' && Number.isFinite(rawQty) ? rawQty : 0;
    void logMetric({
      event: 'token-fiat-checkout-viewed',
      category: 'token',
      value: 'fiat-checkout-view', point: pt,
    });
  }, [router.isReady, hasValidSaleId, saleLoading, sale, resolvedSaleId]);

  const validateIban = (iban: string) => {
    if (!iban.trim()) {
      setIbanError(null);
      return true;
    }

    const isValidIban = isValid(iban);
    if (!isValidIban) {
      setIbanError(t('validation_invalid_iban'));
      return false;
    }

    setIbanError(null);
    return true;
  };

  const handleIbanChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIbanNumber(value);
    validateIban(value);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }

    if (isAuthenticated && !isLoading && user) {
      (async () => {
        const res = await api.get('/charge', {
          params: {
            where: {
              type: 'fiatTokenSale',
              status: 'pending-payment',
              createdBy: user?._id,
            },
            limit: 100,
            sort: '-date',
          },
        });
        if (res?.data?.results && res?.data?.results?.length > 0) {
          setExistingCharges(res?.data?.results);
        }
      })();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (
      !router.isReady ||
      (legacyTokens === undefined && legacyTotalFiat === undefined) ||
      !hasValidSaleId
    ) {
      return;
    }
    router.replace(
      {
        pathname: router.pathname,
        query: { saleId: resolvedSaleId.trim() },
      },
      undefined,
      { shallow: true },
    );
  }, [
    router.isReady,
    legacyTokens,
    legacyTotalFiat,
    hasValidSaleId,
    resolvedSaleId,
    router.pathname,
  ]);

  useEffect(() => {
    if (!router.isReady || !hasValidSaleId) {
      setSale(null);
      setSaleFetchError(null);
      setSaleLoading(false);
      return;
    }
    let cancelled = false;
    setSaleLoading(true);
    setSaleFetchError(null);
    (async () => {
      const fetched = await fetchTokenSaleById(resolvedSaleId.trim());
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
  }, [router.isReady, hasValidSaleId, resolvedSaleId, t]);

  const introTokens = useMemo(() => {
    if (!sale?.quantity && sale?.quantity !== 0) return '';
    return String(sale.quantity);
  }, [sale]);

  const introTotalFiat = useMemo(() => {
    if (sale == null || !Number.isFinite(Number(sale.total_price))) return '';
    return formatIntlNumberTwoDecimals(
      Number(sale.total_price),
      router.locale || undefined,
    );
  }, [sale, router.locale]);

  const goBack = async () => {
    if (hasValidSaleId) {
      router.push(
        `/token/nationality?tokenSaleType=fiat&saleId=${encodeURIComponent(
          resolvedSaleId.trim(),
        )}`,
      );
      return;
    }
    router.push('/token/');
  };

  const handleNext = async () => {
    try {
      if (existingCharges && existingCharges.length > 0) {
        await Promise.all(
          existingCharges.map((charge) => api.delete(`/charge/${charge._id}`)),
        );
      }
    } catch (error) {
      setError(t('token_sale_bank_transfer_delete_error'));
      console.error('error with deleting existing charges:', error);
    }

    try {
      setIsApiLoading(true);
      if (!sale) {
        setIsApiLoading(false);
        return;
      }
      const rawQty = sale.quantity;
      const tokenQty =
        typeof rawQty === 'number' && Number.isFinite(rawQty)
          ? rawQty
          : parseInt(String(rawQty ?? ''), 10);
      const point = Number.isFinite(tokenQty) ? tokenQty : 0;

      const res = await api.post('/token/bank-transfer-application', {
        ibanNumber: ibanNumber.replace(/\s/g, ''),
        totalFiat: sale.total_price,
        userId: user?._id,
        tokens: String(sale.quantity ?? ''),
      });

      if (res.data.status === 'success') {
        const memo =
          typeof res?.data?.memoCode === 'string' ? res.data.memoCode : '';
        const sid = resolvedSaleId.trim();
        if (!sid) {
          void logMetric({
            event: 'apply-error',
            category: 'token',
            value: 'bank-error', point: point,
          });
          setError(t('token_sale_bank_transfer_missing_sale_id'));
          return;
        }
        void logMetric({
          event: 'apply',
          category: 'token',
          value: 'bank-submit', point: point,
        });
        const tf = String(sale.total_price ?? '');
        const qs = new URLSearchParams({
          totalFiat: tf,
          tokenSaleType: 'fiat',
          ibanNumber: ibanNumber.replace(/\s/g, ''),
          memoCode: memo,
        }).toString();
        router.push(`/sale/${encodeURIComponent(sid)}?${qs}`);
      } else {
        void logMetric({
          event: 'apply-error',
          category: 'token',
          value: 'bank-error', point: point,
        });
      }
    } catch (error) {
      const rawQty = sale?.quantity;
      const tokenQty =
        typeof rawQty === 'number' && Number.isFinite(rawQty)
          ? rawQty
          : parseInt(String(rawQty ?? ''), 10);
      const errPoint = Number.isFinite(tokenQty) ? tokenQty : 1;
      void logMetric({
        event: 'apply-error',
        category: 'token',
        value: 'bank-error', point: errPoint,
      });
      setError(parseMessageFromError(error));
      console.error('error with bank transfer:', error);
    } finally {
      setIsApiLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  if (!router.isReady) {
    return (
      <>
        <Head>
          <title>{`
        ${t('token_sale_bank_transfer_title')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
        </Head>
        <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex justify-center pt-24">
          <Spinner />
        </div>
      </>
    );
  }

  if (hasValidSaleId && saleLoading) {
    return (
      <>
        <Head>
          <title>{`
        ${t('token_sale_bank_transfer_title')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
        </Head>
        <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex justify-center pt-24">
          <Spinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_bank_transfer_title')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🤑 {t('token_sale_bank_transfer_title')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS_BANK_TRANSFER} />

        <main className="pt-14 pb-24">
          {saleFetchError && (
            <div className="mb-6">
              <ErrorMessage error={saleFetchError} />
            </div>
          )}
          <p>
            {introTokens && introTotalFiat
              ? t('token_sale_bank_transfer_intro', {
                  tokens: introTokens,
                  totalFiat: introTotalFiat,
                })
              : null}
          </p>

          {existingCharges && (
            <div className="mt-6 bg-yellow-100 p-4 rounded-lg space-y-2">
              <p className="font-bold ">
                {t('token_sale_bank_transfer_existing_application_title')}
              </p>

              <p>
                {t('token_sale_bank_transfer_existing_application_description')}
              </p>
            </div>
          )}
          <Heading level={3} hasBorder={true}>
            💰 {t('token_sale_bank_transfer_next_steps')}
          </Heading>

          <div className="flex flex-col gap-12">
            <Input
              label={t('token_sale_bank_transfer_which_account')}
              onChange={handleIbanChange}
              value={ibanNumber}
              id="ibanNumber"
              isRequired={true}
              placeholder={t('token_sale_bank_transfer_iban_placeholder')}
              validation={ibanError ? 'invalid' : undefined}
              customValidationError={ibanError || undefined}
              successMessage={
                ibanNumber && !ibanError
                  ? t('validation_valid_iban')
                  : undefined
              }
            />

            <div className="flex items-start gap-1">
              <Checkbox
                id="token-terms-agreement"
                isChecked={isTokenTermsAccepted}
                onChange={() => setIsTokenTermsAccepted(!isTokenTermsAccepted)}
              />
              <label htmlFor="token-terms-agreement">
                {t.rich('subscriptions_citizen_agree_to_token_terms', {
                  link1: (chunks) => (
                    <a
                      href={TOKEN_PURCHASE_TERMS_DOC_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {chunks}
                    </a>
                  ),
                  link2: (chunks) => (
                    <a
                      href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </label>
            </div>

            {(error || !hasValidSaleId) && (
              <ErrorMessage
                error={
                  error ?? t('token_sale_bank_transfer_missing_sale_id')
                }
              />
            )}

            <Button
              onClick={handleNext}
              isLoading={isApiLoading}
              isEnabled={
                router.isReady &&
                hasValidSaleId &&
                !!sale &&
                !saleFetchError &&
                introTokens !== '' &&
                isValid(ibanNumber) &&
                !isApiLoading &&
                isTokenTermsAccepted &&
                !ibanError
              }
            >
              {t('token_sale_button_continue')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default BankTransferPage;
