import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { BackButton, Button, ErrorMessage, Heading, Spinner } from '../../components/ui';
import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import type {
  CreateDonationBankResult,
  CreateDonationCardResult,
  CreateDonationCryptoResult,
  DonationPaymentMethod,
} from '../../types/donation';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { logMetricIfAuthenticated } from '../../utils/metrics';
import { saveDonationSession } from '../../utils/donationSessionStorage';
import { priceFormat } from '../../utils/helpers';
import { getDonateInitialProps } from './getDonateInitialProps';

interface DonatePageProps {
  generalConfig: GeneralConfig | null;
}

const DONATION_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 999999;

function clampAmount(value: number) {
  return Math.min(Math.max(MIN_AMOUNT, Math.floor(value)), MAX_AMOUNT);
}

function DonatePage({ generalConfig }: DonatePageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;

  const amountFromQuery = Number(router.query.amount);
  const methodFromQuery = String(router.query.method || 'bank');
  const initialAmount = Number.isFinite(amountFromQuery)
    ? clampAmount(amountFromQuery)
    : 100;
  const initialMethod: DonationPaymentMethod =
    methodFromQuery === 'card'
      ? 'card'
      : methodFromQuery === 'crypto'
        ? 'crypto'
        : 'bank';

  const [amount, setAmount] = useState<number>(initialAmount);
  const [method, setMethod] = useState<DonationPaymentMethod>(initialMethod);
  const [otherAmountStr, setOtherAmountStr] = useState(() =>
    DONATION_AMOUNTS.includes(initialAmount) ? '' : String(initialAmount),
  );
  const [optionalMessage, setOptionalMessage] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady || isAuthLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [router, router.isReady, router.asPath, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (!router.isReady) return;
    const raw = Number(router.query.amount);
    const mtd = String(router.query.method || 'bank');
    if (Number.isFinite(raw)) {
      const next = clampAmount(raw);
      setAmount(next);
      setOtherAmountStr(DONATION_AMOUNTS.includes(next) ? '' : String(next));
    }
    if (mtd === 'card') setMethod('card');
    else if (mtd === 'crypto') setMethod('crypto');
    else setMethod('bank');
  }, [router.isReady, router.query.amount, router.query.method]);

  const updateDonationRoute = useCallback(
    (nextAmount: number, nextMethod: DonationPaymentMethod) => {
      router.replace(`/donate?amount=${nextAmount}&method=${nextMethod}`, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  const goBack = () => {
    router.push('/fundraiser');
  };

  const applyCustomAmount = () => {
    const raw = otherAmountStr.trim();
    if (!raw) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    const next = clampAmount(n);
    setAmount(next);
    setOtherAmountStr(String(next));
    updateDonationRoute(next, method);
  };

  const selectPreset = (next: number) => {
    setAmount(next);
    setOtherAmountStr('');
    updateDonationRoute(next, method);
  };

  const selectMethod = (nextMethod: DonationPaymentMethod) => {
    setMethod(nextMethod);
    updateDonationRoute(amount, nextMethod);
  };

  const handleCreateDonation = async () => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const { data } = await api.post('/donations', {
        price: amount,
        paymentMethod: method,
        message: optionalMessage.trim() || undefined,
      });
      const rawResults = data?.results;
      const results =
        rawResults &&
        typeof rawResults === 'object' &&
        'value' in rawResults &&
        (rawResults as { value: unknown }).value !== undefined
          ? (rawResults as { value: unknown }).value
          : rawResults;
      if (!results || typeof results !== 'object') {
        void logMetricIfAuthenticated(user, {
          event: 'donation-init-error',
          value: 'donation',
          point: amount,
        });
        setCreateError(t('donate_create_invalid_response'));
        return;
      }

      if (method === 'bank') {
        const raw = results as CreateDonationBankResult & {
          confirmation_code?: string;
        };
        const memoCode =
          typeof raw.memoCode === 'string' && raw.memoCode.trim()
            ? raw.memoCode.trim()
            : typeof raw.confirmation_code === 'string' && raw.confirmation_code.trim()
              ? raw.confirmation_code.trim()
              : '';
        if (!raw.saleId || !memoCode || !raw.closerIban) {
          void logMetricIfAuthenticated(user, {
            event: 'donation-init-error',
            value: 'donation',
            point: amount,
          });
          setCreateError(t('donate_create_invalid_response'));
          return;
        }
        const bankResult: CreateDonationBankResult = {
          saleId: raw.saleId,
          memoCode,
          closerIban: raw.closerIban,
          beneficiary: raw.beneficiary,
          beneficiaryAddress: raw.beneficiaryAddress,
          beneficiaryBic: raw.beneficiaryBic,
        };
        saveDonationSession(raw.saleId, { kind: 'bank', amount, result: bankResult });
        void logMetricIfAuthenticated(user, {
          event: 'donation-init-success-bank',
          value: 'donation',
          point: amount,
        });
        await router.push(`/donate/${encodeURIComponent(raw.saleId)}/bank`);
        return;
      }

      if (method === 'card') {
        const r = results as CreateDonationCardResult;
        if (!r.saleId || !r.clientSecret) {
          void logMetricIfAuthenticated(user, {
            event: 'donation-init-error',
            value: 'donation',
            point: amount,
          });
          setCreateError(t('donate_create_invalid_response'));
          return;
        }
        saveDonationSession(r.saleId, { kind: 'card', amount, result: r });
        void logMetricIfAuthenticated(user, {
          event: 'donation-init-success-card',
          value: 'donation',
          point: amount,
        });
        await router.push(`/donate/${encodeURIComponent(r.saleId)}/card`);
        return;
      }

      const r = results as CreateDonationCryptoResult;
      if (!r.saleId || typeof r.expectedAmount !== 'number') {
        void logMetricIfAuthenticated(user, {
          event: 'donation-init-error',
          value: 'donation',
          point: amount,
        });
        setCreateError(t('donate_create_invalid_response'));
        return;
      }
      saveDonationSession(r.saleId, { kind: 'crypto', amount, result: r });
      void logMetricIfAuthenticated(user, {
        event: 'donation-init-success-crypto',
        value: 'donation',
        point: amount,
      });
      await router.push(`/donate/${encodeURIComponent(r.saleId)}/crypto`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        void logMetricIfAuthenticated(user, {
          event: 'donation-init-error',
          value: 'donation',
          point: amount,
        });
        router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
        return;
      }
      void logMetricIfAuthenticated(user, {
        event: 'donation-init-error',
        value: 'donation',
        point: amount,
      });
      setCreateError(parseMessageFromError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  if (!router.isReady || isAuthLoading) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`${t('donate_page_title')} - ${platformName}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2 mb-1">
          {t('donate_step_label', { current: 1, total: 2 })}
        </p>
        <Heading level={1} className="mb-2">
          {t('donate_page_title')}
        </Heading>
        <p className="text-sm text-gray-600 mb-4">{t('donate_page_subtitle')}</p>

        <div className="flex flex-col gap-8">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {t('donate_amount_label')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DONATION_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                    amount === preset && otherAmountStr === ''
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-200 hover:border-accent'
                  }`}
                >
                  {priceFormat(preset, DEFAULT_CURRENCY)}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <label htmlFor="donate-custom-amount" className="text-sm font-medium text-gray-800">
                {t('donate_custom_label')}
              </label>
              <input
                id="donate-custom-amount"
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                inputMode="numeric"
                placeholder={t('donate_custom_placeholder')}
                value={otherAmountStr}
                onChange={(e) => setOtherAmountStr(e.target.value)}
                onBlur={applyCustomAmount}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {t('donate_payment_method_label')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectMethod('bank')}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  method === 'bank'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 hover:border-accent'
                }`}
              >
                {t('donate_method_bank')}
              </button>
              <button
                type="button"
                onClick={() => selectMethod('card')}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  method === 'card'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 hover:border-accent'
                }`}
              >
                {t('donate_method_card')}
              </button>
              <button
                type="button"
                onClick={() => selectMethod('crypto')}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  method === 'crypto'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 hover:border-accent'
                }`}
              >
                {t('donate_method_crypto')}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="donate-message" className="text-sm font-semibold text-gray-900 mb-2 block">
              {t('donate_message_optional')}
            </label>
            <textarea
              id="donate-message"
              rows={3}
              value={optionalMessage}
              onChange={(e) => setOptionalMessage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {createError && <ErrorMessage error={createError} />}

          <Button onClick={handleCreateDonation} isLoading={createLoading} isEnabled={!createLoading}>
            {t('donate_continue_prepare')}
          </Button>
        </div>
      </div>
    </>
  );
}

DonatePage.getInitialProps = async (context: NextPageContext) => getDonateInitialProps(context);

export default DonatePage;
