import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import CreditsCheckoutForm from '../../components/CreditsCheckoutForm';
import CreditsCryptoPayment from '../../components/CreditsCryptoPayment';
import CreditsListingPreview from '../../components/CreditsListingPreview';
import {
  PaymentMethodTabs,
  type PaymentMethodTab,
} from '../../components/PaymentMethodTabs';
import {
  BackButton,
  Card,
  ErrorMessage,
  Heading,
  Information,
  Row,
} from '../../components/ui/';

import { Minus, Plus } from 'lucide-react';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  CreditConfig,
  FundraisingConfig,
  GeneralConfig,
  PaymentConfig,
} from '../../types';
import {
  getCachedConfig,
  getSavedConfig,
} from '../../utils/cachedConfig.helpers';
import { mergePaymentValueWithBookingCurrencyFallback } from '../../utils/config.utils';
import {
  clampCreditAmount,
  getBonusCreditsForAmount,
  getCreditPackages,
  getCreditPricePerUnit,
  getCreditPurchaseLimits,
  getCreditPurchasePrice,
  getVolumeDiscounts,
  isCreditPurchaseEnabled,
  parseCreditAmountFromQuery,
} from '../../utils/credits.helpers';
import { getVatInfo, priceFormat } from '../../utils/helpers';
import PageNotFound from '../not-found';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
  {
    stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
  },
);

const CreditsCheckoutPage: NextPage = () => {
  const creditConfig = getCachedConfig('credit') as CreditConfig | null;
  const savedCreditConfig = getSavedConfig('credit');
  const fundraisingConfig = getCachedConfig(
    'fundraiser',
  ) as FundraisingConfig | null;
  const paymentConfig = (mergePaymentValueWithBookingCurrencyFallback(
    getCachedConfig('payment'),
    getCachedConfig('booking'),
  ) ?? null) as PaymentConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;

  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const defaultConfig = useConfig();

  const isCreditPaymentEnabled = isCreditPurchaseEnabled({
    creditConfig,
    fundraisingConfig,
  });
  const isPaymentEnabled = paymentConfig?.enabled || false;
  const isCryptoEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true' &&
    Boolean(creditConfig?.allowCryptoPayment);

  const pricePerUnit = getCreditPricePerUnit(
    creditConfig,
    fundraisingConfig,
    savedCreditConfig,
  );
  const limits = useMemo(
    () => getCreditPurchaseLimits(creditConfig),
    [creditConfig],
  );
  const volumeDiscounts = useMemo(
    () => getVolumeDiscounts(creditConfig),
    [creditConfig],
  );
  const packages = useMemo(
    () => getCreditPackages(creditConfig, pricePerUnit),
    [creditConfig, pricePerUnit],
  );

  const [credits, setCredits] = useState(() =>
    parseCreditAmountFromQuery(router.query.amount, limits),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodTab>('card');

  // The query is only readable after hydration on a statically served page,
  // so the amount from `?amount=` lands on the second render.
  useEffect(() => {
    if (!router.isReady) return;
    setCredits(parseCreditAmountFromQuery(router.query.amount, limits));
  }, [router.isReady, router.query.amount, limits.min, limits.max]);

  // `isAuthenticated` is false while the session is still being read from the
  // cookie, so waiting for `isLoading` is what keeps a signed-in member from
  // being bounced to signup on their way to the checkout.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isLoading, isAuthenticated]);

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const bonusCredits = getBonusCreditsForAmount(packages, credits);
  const price = getCreditPurchasePrice(credits, pricePerUnit, volumeDiscounts);
  const totalCredits = credits + bonusCredits;

  const setAmount = (next: number) =>
    setCredits(clampCreditAmount(next, limits));

  const goBack = () => {
    router.push('/settings/credits');
  };

  const onSuccess = () => {
    router.push(`/settings/credits?purchased=${totalCredits}`);
  };

  if (!isCreditPaymentEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_checkout_title')} - ${t(
          'carrots_heading',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-2">
          🥕 {t('credits_checkout_title')}
        </Heading>
        <p className="text-gray-600 mb-8">
          {t('credits_checkout_subtitle', {
            price: priceFormat(pricePerUnit, DEFAULT_CURRENCY),
          })}
        </p>

        <main className="pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {t('credits_checkout_amount_subtitle')}
            </Heading>

            {packages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {packages.map((pkg) => {
                  const isSelected = pkg.credits === credits;
                  return (
                    <button
                      key={`${pkg.title || 'package'}-${pkg.credits}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setAmount(pkg.credits)}
                      className={`relative rounded-xl border-2 p-3 text-left transition-all hover:border-accent ${
                        isSelected
                          ? 'border-accent bg-accent-light'
                          : 'border-gray-200'
                      }`}
                    >
                      {pkg.discountPercent > 0 && (
                        <span className="absolute -top-2 right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {t('credits_checkout_discount_badge', {
                            percent: pkg.discountPercent,
                          })}
                        </span>
                      )}
                      <div className="font-bold text-lg">🥕 {pkg.credits}</div>
                      {pkg.title && (
                        <div className="text-xs font-medium truncate">
                          {pkg.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-600">
                        {pkg.discountPercent > 0 && (
                          <span className="line-through mr-1 text-gray-400">
                            {priceFormat(pkg.fullPrice, DEFAULT_CURRENCY)}
                          </span>
                        )}
                        {priceFormat(pkg.price, DEFAULT_CURRENCY)}
                      </div>
                      {pkg.bonusCredits > 0 && (
                        <div className="text-xs font-medium text-system-success">
                          {t('credits_checkout_bonus_badge', {
                            credits: pkg.bonusCredits,
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-center gap-6 mb-4">
                <button
                  type="button"
                  aria-label={t('credits_checkout_decrease')}
                  onClick={() => setAmount(credits - 1)}
                  disabled={credits <= limits.min}
                  className="w-12 h-12 rounded-full border-2 border-accent text-accent flex items-center justify-center disabled:border-disabled disabled:text-disabled"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <label className="sr-only" htmlFor="credits-amount">
                    {t('credits_checkout_amount_label')}
                  </label>
                  <input
                    id="credits-amount"
                    type="number"
                    inputMode="numeric"
                    min={limits.min}
                    max={limits.max}
                    value={credits}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    className="w-28 text-center text-4xl font-bold bg-transparent"
                  />
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    {t('carrots_heading')}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={t('credits_checkout_increase')}
                  onClick={() => setAmount(credits + 1)}
                  disabled={credits >= limits.max}
                  className="w-12 h-12 rounded-full border-2 border-accent text-accent flex items-center justify-center disabled:border-disabled disabled:text-disabled"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <input
                type="range"
                aria-label={t('credits_checkout_slider_label')}
                min={limits.min}
                max={limits.max}
                value={credits}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>🥕 {limits.min}</span>
                <span>🥕 {limits.max}</span>
              </div>

              {volumeDiscounts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                  <span className="text-gray-600">
                    {t('credits_checkout_tiers_label')}
                  </span>
                  {volumeDiscounts.map((tier) => (
                    <button
                      key={tier.minCredits}
                      type="button"
                      onClick={() => setAmount(tier.minCredits)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        credits >= tier.minCredits
                          ? 'border-accent bg-accent-light text-accent'
                          : 'border-gray-200 text-gray-600 hover:border-accent'
                      }`}
                    >
                      {t('credits_checkout_tier_chip', {
                        credits: tier.minCredits,
                        percent: tier.discountPercent,
                      })}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-700 mt-4 text-center sm:text-left">
                <CreditsListingPreview
                  credits={totalCredits}
                  className="justify-center sm:justify-start"
                />
              </div>
            </div>

            <Card className="gap-2">
              <Row
                rowKey={t('credits_checkout_credits_row', { credits })}
                value={priceFormat(price.subtotal, DEFAULT_CURRENCY)}
              />
              {price.discountPercent > 0 && (
                <Row
                  className="text-system-success"
                  rowKey={t('credits_checkout_volume_discount_row', {
                    percent: price.discountPercent,
                  })}
                  value={`−${priceFormat(
                    price.discountAmount,
                    DEFAULT_CURRENCY,
                  )}`}
                />
              )}
              {bonusCredits > 0 && (
                <Row
                  className="text-system-success"
                  rowKey={t('credits_checkout_bonus_row')}
                  value={`🥕 +${bonusCredits}`}
                />
              )}
              <Row
                className="border-t pt-2 font-bold"
                rowKey={t('bookings_checkout_step_total_title')}
                value={priceFormat(price.total, DEFAULT_CURRENCY)}
                additionalInfo={`${t(
                  'bookings_checkout_step_total_description',
                )} ${getVatInfo({
                  val: price.total,
                  cur: DEFAULT_CURRENCY,
                })}`}
              />
            </Card>
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">💲</span>
              {t('subscriptions_checkout_payment_subtitle')}
            </Heading>

            {isCryptoEnabled && (
              <PaymentMethodTabs
                active={paymentMethod}
                onChange={setPaymentMethod}
                className="mb-6"
              />
            )}

            <div className="mb-10">
              {paymentMethod === 'crypto' && isCryptoEnabled ? (
                <CreditsCryptoPayment
                  credits={credits}
                  total={price.total}
                  isEnabled={credits > 0}
                  onSuccess={onSuccess}
                />
              ) : isPaymentEnabled ? (
                <Elements stripe={stripePromise}>
                  <CreditsCheckoutForm
                    userEmail={user?.email}
                    credits={credits}
                    total={price.total}
                    onSuccess={onSuccess}
                  />
                </Elements>
              ) : isCryptoEnabled ? (
                <Information>
                  {t('credits_checkout_card_disabled_use_crypto')}
                </Information>
              ) : (
                <ErrorMessage error={t('checkout_payment_disabled_error')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreditsCheckoutPage;
