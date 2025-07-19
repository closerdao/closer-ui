import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import CurrencySwitcher from '../../../components/CurrencySwitcher';
import PageError from '../../../components/PageError';
import RedeemCredits from '../../../components/RedeemCredits';
import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';
import Row from '../../../components/ui/Row';

import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useBookingSmartContract } from '../../../hooks/useBookingSmartContract';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  CloserCurrencies,
  Event,
  Listing,
  PaymentConfig,
  PaymentType,
} from '../../../types';
import api from '../../../utils/api';
import { getPaymentType, payTokens } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event | null;
  bookingConfig: BookingConfig | null;
  paymentConfig: PaymentConfig | null;
}

const Checkout = ({
  booking,
  listing,
  error,
  event,
  bookingConfig,
  paymentConfig,
}: Props) => {
  const t = useTranslations();
  const isHourlyBooking = listing?.priceDuration === 'hour';
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [updatedBooking, setUpdatedBooking] = useState<Booking | null>(null);
console.log('booking=', booking);
  const {
    utilityFiat,
    foodFiat,
    rentalToken,
    rentalFiat,
    eventFiat,
    useTokens,
    useCredits,
    start,
    status,
    dailyRentalToken,
    duration,
    ticketOption,
    eventPrice,
    total,
    _id,
    eventId,
    adults,
  } = updatedBooking ?? booking ?? {};

  console.log('total=', total);

  const cancellationPolicy = bookingConfig
    ? {
        lastday: bookingConfig.cancellationPolicyLastday,
        lastweek: bookingConfig.cancellationPolicyLastweek,
        lastmonth: bookingConfig.cancellationPolicyLastmonth,
        default: bookingConfig.cancellationPolicyDefault,
      }
    : null;

  const { balanceAvailable: tokenBalanceAvailable, isWalletReady } =
    useContext(WalletState);

  const { user, isAuthenticated } = useAuth();

  const totalToPayInFiat = booking?.paymentDelta?.fiat ||
    total || { val: 0, cur: CloserCurrencies.EUR };

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  const bookingYear = dayjs(start).year();
  const bookingStartDayOfYear = dayjs(start).dayOfYear();
  const bookingNights = Array.from({ length: duration || 0 }, (_, i) => [
    bookingYear,
    bookingStartDayOfYear + i,
  ]);
  const { stakeTokens, isStaking, checkContract } = useBookingSmartContract({
    bookingNights,
  });
  const router = useRouter();

  const isNotEnoughBalance = rentalToken?.val
    ? tokenBalanceAvailable < rentalToken?.val
    : false;

  const listingName = listing?.name;
  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [canApplyCredits, setCanApplyCredits] = useState(false);
  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);
  const [creditsError, setCreditsError] = useState(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [useCreditsUpdated, setUseCreditsUpdated] = useState(useCredits);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [currency, setCurrency] = useState<CloserCurrencies>(
    useTokens ? CURRENCIES[1] : DEFAULT_CURRENCY,
  );

  const creditsOrTokensPricePerNight = listing?.tokenPrice?.val;

  const maxNightsToPayWithCredits =
    (creditsBalance &&
    creditsOrTokensPricePerNight &&
    Math.floor(creditsBalance / creditsOrTokensPricePerNight) < (duration || 0)
      ? Math.floor(creditsBalance / (creditsOrTokensPricePerNight || 1))
      : duration) || 0;

  const maxNightsToPayWithTokens =
    (creditsOrTokensPricePerNight &&
      isWalletReady &&
      Math.floor(tokenBalanceAvailable / creditsOrTokensPricePerNight)) ||
    0;

  const partialPriceInCredits =
    maxNightsToPayWithCredits < (duration || 0)
      ? maxNightsToPayWithCredits * (creditsOrTokensPricePerNight || 0)
      : (duration || 0) * (creditsOrTokensPricePerNight || 0);

  const priceInCredits = partialPriceInCredits || rentalToken?.val || 0;

  const [partialPriceInTokens, setPartialPriceInTokens] = useState(0);

  const [paymentType, setPaymentType] = useState<PaymentType>(
    getPaymentType({
      useCredits: useCredits || false,
      duration: duration || 0,
      currency,
      maxNightsToPayWithTokens,
      maxNightsToPayWithCredits,
    }),
  );

  useEffect(() => {
    const type = getPaymentType({
      useCredits: useCredits || false,
      duration: duration || 0,
      currency,
      maxNightsToPayWithTokens,
      maxNightsToPayWithCredits,
    });

    setPaymentType(type);
    switch (type) {
      case PaymentType.PARTIAL_TOKENS:
        {
          const nights = maxNightsToPayWithTokens;
          const price =
            (maxNightsToPayWithTokens || 0) *
              (creditsOrTokensPricePerNight || 0) || 0;
          setPartialPriceInTokens(price);
          if (!useTokens) {
            switchToToken(nights, price, type);
          }
        }
        break;
      case PaymentType.FULL_TOKENS:
        {
          setPartialPriceInTokens(
            (maxNightsToPayWithTokens || 0) *
              (creditsOrTokensPricePerNight || 0),
          );
          if (!useTokens) {
            switchToToken(0, 0, type);
          }
        }
        break;
      case PaymentType.PARTIAL_CREDITS:
        if (useTokens) {
          switchToFiat(type);
        }
        break;
      case PaymentType.FULL_CREDITS:
        if (useTokens) {
          switchToFiat(type);
        }
        break;
      case PaymentType.FIAT:
        if (useTokens) {
          switchToFiat(type);
        }
        break;
    }
  }, [
    currency,
    tokenBalanceAvailable,
    useCredits,
    maxNightsToPayWithCredits,
    maxNightsToPayWithTokens,
    useTokens,
    creditsOrTokensPricePerNight,
    duration,
  ]);

  const isStripeBooking = total && total.val > 0;
  const isFreeBooking = total && total.val === 0 && !useTokens;
  const isTokenOnlyBooking =
    useTokens &&
    rentalToken &&
    rentalToken?.val > 0 &&
    total &&
    total.val === 0;

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const [areCreditsAvailable, creditsBalance] = await Promise.all([
            api
              .post('/carrots/availability', {
                startDate: start,
                creditsAmount: rentalToken?.val || 0,
                minCreditsAmount: creditsOrTokensPricePerNight,
              })
              .then((response) => response.data.results),
            api
              .get('/carrots/balance')
              .then((response) => response.data.results),
          ]);
          setCreditsBalance(creditsBalance);
          setCanApplyCredits(areCreditsAvailable && !useTokens);
        } catch (error) {
          setCanApplyCredits(false);
        }
      })();
    }
  }, [user, currency, useTokens]);

  useEffect(() => {
    if (booking?.status === 'paid') {
      if (router) {
        router.push(`/bookings/${booking?._id}`);
      }
    }
  }, [router]);

  const renderButtonText = () => {
    if (isStaking) {
      return t('checkout_processing_token_payment');
    }
    return t('checkout_pay');
  };

  const goBack = () => {
    router.push(`/bookings/${booking?._id}/summary`);
  };

  const handleFreeBooking = async () => {
    try {
      setProcessing(true);
      if (useCreditsUpdated) {
        await api.post(`/bookings/${booking?._id}/credit-payment`, {
          startDate: start,
          creditsAmount: rentalToken?.val,
        });
      }
      await api.post('/bookings/payment', {
        type: 'booking',
        ticketOption,
        total,
        _id: booking?._id,
        email: user?.email,
        name: user?.screenname,
      });
    } catch (error) {
      setPaymentError(parseMessageFromError(error));
    } finally {
      setProcessing(false);
    }
    router.push(`/bookings/${booking?._id}`);
  };

  const onSuccess = () => {
    router.push(
      `/bookings/${_id}/confirmation${eventId ? `?eventId=${eventId}` : ''}`,
    );
  };

  const handleTokenOnlyBooking = async () => {
    setProcessing(true);
    setPaymentError(null);
    const tokenStakingResult = await payTokens(
      _id,
      dailyRentalToken?.val,
      stakeTokens,
      checkContract,
    );

    const { error } = tokenStakingResult || {};
    if (error) {
      setProcessing(false);
      setPaymentError(error);
      console.log('error=', error);
      return;
    }

    try {
      await api.post('/bookings/payment', {
        isTokenOnlyBooking: true,
        _id,
      });
      onSuccess();
    } catch (error) {
      console.log('error=', error);
    }
  };

  const applyCredits = async () => {
    try {
      setCreditsError(null);
      const localUpdatedBooking = await updateBooking({
        useTokens: false,
        useCredits: true,
        paymentType:
          maxNightsToPayWithCredits > 0 &&
          maxNightsToPayWithCredits < (duration || 0)
            ? PaymentType.PARTIAL_CREDITS
            : PaymentType.FULL_CREDITS,
      });
      setUpdatedBooking(localUpdatedBooking);
      setUseCreditsUpdated(true);
    } catch (error) {
      setCreditsError(parseMessageFromError(error));
    }
  };

  const updateBooking = async ({
    useTokens,
    useCredits,
    paymentType,
    partialTokenPaymentNights,
    partialPriceInTokens,
  }: {
    useTokens: boolean;
    useCredits?: boolean;
    partialTokenPaymentNights?: number;
    partialPriceInTokens?: number;
    paymentType?: PaymentType;
  }) => {
    try {
      const res = await api.post(`/bookings/${booking?._id}/update-payment`, {
        useCredits,
        useTokens,
        isHourlyBooking,
        paymentType,
        partialTokenPaymentNights,
        partialPriceInTokens,
      });
      return res.data.results;
    } catch (error) {
      console.log('error=', error);
    }
  };

  const switchToFiat = async (type: PaymentType) => {
    const localUpdatedBooking = await updateBooking({
      useTokens: false,
      useCredits,
      paymentType: type,
    });
    setUpdatedBooking(localUpdatedBooking);
  };

  const switchToToken = async (
    nights: number,
    price: number,
    type: PaymentType,
  ) => {
    const localUpdatedBooking = await updateBooking({
      useTokens: true,
      useCredits: false,
      partialTokenPaymentNights: nights,
      partialPriceInTokens: price,
      paymentType: type,
    });
    setUpdatedBooking(localUpdatedBooking);
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          <span className="mr-1">💰</span>
          <span>{t('bookings_checkout_step_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <div className="mt-16 flex flex-col gap-16">
          {status === 'pending-payment' ? (
            <CheckoutTotal
              total={booking?.paymentDelta?.fiat}
              useTokens={false}
              useCredits={false}
              rentalToken={rentalToken}
              vatRate={vatRate}
              priceInCredits={priceInCredits}
            />
          ) : (
            <>
              {isWeb3BookingEnabled && !ticketOption?.isDayTicket && (
                <CurrencySwitcher
                  selectedCurrency={currency}
                  onSelect={setCurrency as any}
                  currencies={CURRENCIES}
                />
              )}
              <div>
                {eventPrice && (
                  <div>
                    <HeadingRow>
                      <span className="mr-2">🎉</span>
                      <span>{t('bookings_checkout_ticket_cost')}</span>
                    </HeadingRow>
                    <div className="mb-16 mt-4">
                      <Row
                        rowKey={ticketOption?.name}
                        value={`${priceFormat(eventFiat?.val, eventFiat?.cur)}`}
                      />
                    </div>
                  </div>
                )}
                {!ticketOption?.isDayTicket && (
                  <>
                    <HeadingRow>
                      <span className="mr-2">🏡</span>
                      <span>
                        {isHourlyBooking
                          ? t('bookings_checkout_step_accomodation')
                          : t('bookings_checkout_step_hourly')}
                      </span>
                    </HeadingRow>
                    <div className="flex justify-between items-center mt-3">
                      <p>{listingName}</p>
                      {useTokens && rentalToken ? (
                        <>
                          {paymentType === PaymentType.PARTIAL_TOKENS ? (
                            <div>
                              <p className="font-bold">
                                {priceFormat({
                                  val: partialPriceInTokens,
                                  cur: rentalToken?.cur,
                                })}{' '}
                                + {priceFormat(rentalFiat)}
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold">
                              {priceFormat(rentalToken)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-bold">
                          {useCredits && (
                            <>
                              {priceFormat({
                                val: priceInCredits,
                                cur: 'credits',
                              })}{' '}
                              +{' '}
                            </>
                          )}
                          {priceFormat(rentalFiat)}
                        </p>
                      )}
                    </div>
                    <p className="text-right text-xs">
                      {isHourlyBooking
                        ? t(
                            'bookings_checkout_step_accomodation_description_hourly',
                          )
                        : t('bookings_checkout_step_accomodation_description')}
                    </p>
                  </>
                )}
                {process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true' &&
                canApplyCredits &&
                !useTokens &&
                !booking?.volunteerId &&
                ((rentalFiat && rentalFiat?.val > 0) || useCredits) ? (
                  <RedeemCredits
                    isPartialCreditsPayment={
                      paymentType === PaymentType.PARTIAL_CREDITS
                    }
                    priceInCredits={priceInCredits}
                    maxNightsToPayWithCredits={maxNightsToPayWithCredits}
                    useCredits={useCredits}
                    rentalFiat={rentalFiat}
                    rentalToken={{
                      val: listing?.private
                        ? (dailyRentalToken?.val || 0) * (duration || 0)
                        : (dailyRentalToken?.val || 0) *
                          (duration || 0) *
                          (adults || 0),
                      cur: CloserCurrencies.TDF,
                    }}
                    applyCredits={applyCredits}
                    hasAppliedCredits={useCredits || status === 'credits-paid'}
                        creditsError={creditsError}
                    className="my-12"
                  />
                  ) : null}
                  
                
                {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' &&
                  rentalToken &&
                  rentalToken?.val > 0 &&
                  useTokens && (
                    <div className="mt-4">
                      <BookingWallet
                        toPay={
                          paymentType === PaymentType.PARTIAL_TOKENS
                            ? partialPriceInTokens
                            : rentalToken?.val
                        }
                        switchToFiat={() => setCurrency(DEFAULT_CURRENCY)}
                      />
                    </div>
                  )}
              </div>
              {!isHourlyBooking &&
              utilityFiat?.val &&
              bookingConfig?.utilityOptionEnabled ? (
                <div>
                  <HeadingRow>
                    <span className="mr-2">🛠</span>
                    <span>{t('bookings_checkout_step_utility_title')}</span>
                  </HeadingRow>
                  <div className="flex justify-between items-center mt-3">
                    <p> {t('bookings_summary_step_utility_total')}</p>
                    <p className="font-bold">{priceFormat(utilityFiat)}</p>
                  </div>
                  <p className="text-right text-xs">
                    {t('bookings_summary_step_utility_description')}
                  </p>
                </div>
              ) : null}
              {!isHourlyBooking && foodFiat?.val ? (
                <div>
                  <HeadingRow>
                    <span className="mr-2">🥦</span>
                    <span>{t('bookings_checkout_step_food_title')}</span>
                  </HeadingRow>
                  <div className="flex justify-between items-center mt-3">
                    <p> {t('bookings_summary_step_food_total')}</p>
                    <p className="font-bold">
                      {booking?.foodOptionId
                        ? priceFormat(foodFiat)
                        : 'NOT INCLUDED'}
                    </p>
                  </div>
                  <p className="text-right text-xs">
                    {t('bookings_summary_step_utility_description')}
                  </p>
                </div>
              ) : null}
              <CheckoutTotal
                total={total}
                useTokens={useTokens || false}
                useCredits={useCredits || false}
                rentalToken={rentalToken}
                vatRate={vatRate}
                priceInCredits={priceInCredits}
              />
            </>
          )}

          <div className="flex flex-col gap-2">
            {isStripeBooking && (
              <CheckoutPayment
                cancellationPolicy={cancellationPolicy}
                isPartialCreditsPayment={
                  paymentType === PaymentType.PARTIAL_CREDITS
                }
                partialPriceInCredits={partialPriceInCredits}
                bookingId={booking?._id || ''}
                buttonDisabled={
                  (useTokens &&
                    (!hasAgreedToWalletDisclaimer || isNotEnoughBalance)) ||
                  false
                }
                useTokens={useTokens || false}
                useCredits={useCredits}
                totalToPayInFiat={totalToPayInFiat}
                dailyTokenValue={dailyRentalToken?.val || 0}
                startDate={start}
                rentalToken={dailyRentalToken?.val || 0 * (duration || 0)}
                totalNights={duration || 0}
                user={user}
                eventId={event?._id}
                status={booking?.status}
              />
            )}
            {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' &&
              rentalToken &&
              rentalToken?.val > 0 &&
              useTokens && (
                <Checkbox
                  isChecked={hasAgreedToWalletDisclaimer}
                  onChange={() =>
                    setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                  }
                  className="mt-8"
                >
                  {t('bookings_checkout_step_wallet_disclaimer')}
                </Checkbox>
              )}
          </div>
          {isFreeBooking && (
            <Button
              isEnabled={!processing}
              className="booking-btn"
              onClick={handleFreeBooking}
            >
              {user?.roles.includes('member') || booking?.status === 'confirmed'
                ? t('buttons_confirm_booking')
                : t('buttons_booking_request')}
            </Button>
          )}
          {isTokenOnlyBooking && (
            <Button
              isEnabled={
                !processing && !isStaking && hasAgreedToWalletDisclaimer
              }
              className="booking-btn"
              onClick={handleTokenOnlyBooking}
            >
              {renderButtonText()}
            </Button>
          )}
          {paymentError && <ErrorMessage error={paymentError} />}
        </div>
      </div>
    </>
  );
};

Checkout.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [bookingRes, bookingConfigRes, paymentConfigRes] = await Promise.all([
      api
        .get(`/booking/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      api.get('/config/payment').catch(() => {
        return null;
      }),
      api.get('/config/payment').catch(() => {
        return null;
      }),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const paymentConfig = paymentConfigRes?.data?.results?.value;

    const [optionalEvent, optionalListing, messages] = await Promise.all([
      booking.eventId &&
        api.get(`/event/${booking.eventId}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
      booking.listing &&
        api.get(`/listing/${booking.listing}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;

    return {
      booking,
      listing,
      event,
      error: null,
      bookingConfig,
      paymentConfig,
      messages,
    };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      booking: null,
      bookingConfig: null,
      listing: null,
      messages: null,
      paymentConfig: null,
    };
  }
};

export default Checkout;
