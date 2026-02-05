import { useRouter } from 'next/router';

import { useContext, useEffect, useMemo, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import {
  IconCheckCircle,
  IconHome,
  IconMail,
  IconPartyPopper,
  IconXCircle,
} from '../../../components/BookingIcons';
import BookingWallet from '../../../components/BookingWallet';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import CurrencySwitcher from '../../../components/CurrencySwitcher';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
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
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Contract, utils } from 'ethers';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

dayjs.extend(dayOfYear);

import PageNotAllowed from '../../401';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useBookingSmartContract } from '../../../hooks/useBookingSmartContract';
import { useConfig } from '../../../hooks/useConfig';
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
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

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
  const {
    utilityFiat,
    foodFiat,
    rentalToken,
    rentalFiat,
    eventFiat,
    useTokens,
    useCredits,
    start,
    end,
    status,
    dailyRentalToken,
    duration,
    ticketOption,
    eventPrice,
    total,
    _id,
    eventId,
    adults,
    transactionId,
    createdBy,
  } = (updatedBooking ?? booking ?? {}) as Booking;

  const cancellationPolicy = bookingConfig
    ? {
        lastday: bookingConfig.cancellationPolicyLastday,
        lastweek: bookingConfig.cancellationPolicyLastweek,
        lastmonth: bookingConfig.cancellationPolicyLastmonth,
        default: bookingConfig.cancellationPolicyDefault,
      }
    : null;

  const { balanceAvailable: tokenBalanceAvailable, isWalletReady, library, account } =
    useContext(WalletState);
  
  const {
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DIAMOND_ABI,
    BLOCKCHAIN_DAO_TOKEN,
  } = useConfig() || {};

  const { user, isAuthenticated } = useAuth();

  const totalToPayInFiat = booking?.paymentDelta?.fiat ||
    total || { val: 0, cur: CloserCurrencies.EUR };

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  const bookingYear = dayjs(start).year();
  const bookingStartDayOfYear = dayjs(start).dayOfYear();
  const router = useRouter();

  // Check if this is a friend accessing the checkout page
  const isFriend = router.query.isFriend === 'true';

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
  const [conflictingBookings, setConflictingBookings] = useState<{ all: any[]; sameUser: any[]; otherUser: any[] } | null>(null);
  const [onChainData, setOnChainData] = useState<any[] | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [onChainError, setOnChainError] = useState<string | null>(null);
  const [blockchainDebugInfo, setBlockchainDebugInfo] = useState<any>(null);
  const [globalOverlappingBookings, setGlobalOverlappingBookings] = useState<any[] | null>(null);
  const [globalBookingsLoading, setGlobalBookingsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [useCreditsUpdated, setUseCreditsUpdated] = useState(useCredits);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [currency, setCurrency] = useState<CloserCurrencies>(
    useTokens ? CURRENCIES[1] : DEFAULT_CURRENCY,
  );
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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

  const [partialPriceInTokens, setPartialPriceInTokens] = useState(0);

  const isAdditionalFiatPayment = Boolean(
    booking?.paymentDelta?.fiat?.val && booking?.paymentDelta?.fiat?.val > 0,
  );

  const [paymentType, setPaymentType] = useState<PaymentType>(
    getPaymentType({
      useCredits: useCredits || false,
      duration: duration || 0,
      currency,
      maxNightsToPayWithTokens,
      maxNightsToPayWithCredits,
      isAdditionalFiatPayment,
    }),
  );

  // Calculate how many nights should be paid with tokens
  const nightsToPayWithTokens = useMemo(() => {
    return paymentType === PaymentType.PARTIAL_TOKENS
      ? maxNightsToPayWithTokens
      : duration || 0;
  }, [paymentType, maxNightsToPayWithTokens, duration]);

  const bookingNights = useMemo(() => {
    return Array.from({ length: nightsToPayWithTokens }, (_, i) => [
      bookingYear,
      bookingStartDayOfYear + i,
    ]);
  }, [nightsToPayWithTokens, bookingYear, bookingStartDayOfYear]);

  const { stakeTokens, isStaking, checkContract } = useBookingSmartContract({
    bookingNights,
  });

  const [priceInCredits, setPriceInCredits] = useState(
    paymentType === PaymentType.FULL_CREDITS
      ? rentalToken?.val || 0
      : paymentType === PaymentType.FIAT &&
        maxNightsToPayWithCredits >= (duration || 0)
      ? rentalToken?.val || 0
      : partialPriceInCredits || rentalToken?.val || 0,
  );

  const shouldShowTokenDisclaimer =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' &&
    rentalToken &&
    rentalToken?.val > 0 &&
    useTokens;

  useEffect(() => {
    const type = getPaymentType({
      useCredits: useCredits || false,
      duration: duration || 0,
      currency,
      maxNightsToPayWithTokens,
      maxNightsToPayWithCredits,
    });

    setPaymentType(type);

    // Update priceInCredits based on payment type
    if (type === PaymentType.FULL_CREDITS) {
      setPriceInCredits(rentalToken?.val || 0);
    } else if (
      type === PaymentType.FIAT &&
      maxNightsToPayWithCredits >= (duration || 0)
    ) {
      // When payment type is FIAT but user has enough credits to cover full stay,
      // calculate credits price as if it were FULL_CREDITS
      setPriceInCredits(rentalToken?.val || 0);
    } else {
      setPriceInCredits(partialPriceInCredits || rentalToken?.val || 0);
    }

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

      case PaymentType.FULL_CREDITS:
      case PaymentType.PARTIAL_CREDITS:
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
    rentalToken?.val,
    partialPriceInCredits,
  ]);

  const isFreeBooking = total && total.val === 0 && !useTokens;
  const isTokenOnlyBooking =
    useTokens &&
    rentalToken &&
    rentalToken?.val > 0 &&
    total &&
    total.val === 0;
  const isFriendsBooking = Boolean(booking?.isFriendsBooking);
  const isStripeBooking = !isTokenOnlyBooking && !isFreeBooking;

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
      if (useCreditsUpdated && !booking?.paymentDelta?.fiat?.val) {
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

  const fetchOnChainData = async () => {
    setOnChainLoading(true);
    setOnChainError(null);
    
    if (!library) {
      setOnChainError('Wallet not connected. Please connect your wallet to view on-chain data.');
      setOnChainLoading(false);
      return;
    }
    if (!account) {
      setOnChainError('No wallet account found. Please connect your wallet.');
      setOnChainLoading(false);
      return;
    }
    if (!BLOCKCHAIN_DAO_DIAMOND_ADDRESS || !BLOCKCHAIN_DIAMOND_ABI) {
      setOnChainError('Blockchain configuration not loaded.');
      setOnChainLoading(false);
      return;
    }
    
    try {
      const Diamond = new Contract(
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
        BLOCKCHAIN_DIAMOND_ABI,
        library,
      );
      const year = dayjs(start).year();
      const bookings = await Diamond.getAccommodationBookings(account, year);
      const formattedBookings = bookings.map((b: any) => ({
        status: b.status,
        year: b.year,
        dayOfYear: b.dayOfYear,
        price: b.price ? utils.formatUnits(b.price, BLOCKCHAIN_DAO_TOKEN?.decimals || 18) : '0',
        date: dayjs().year(b.year).dayOfYear(b.dayOfYear).format('YYYY-MM-DD'),
      })).filter((b: any) => b.status > 0);
      setOnChainData(formattedBookings.length > 0 ? formattedBookings : []);
    } catch (err: any) {
      setOnChainError(`Failed to fetch on-chain data: ${err?.message || 'Unknown error'}`);
    } finally {
      setOnChainLoading(false);
    }
  };

  const fetchGlobalOverlappingBookings = async () => {
    if (!start || !end) return;
    
    setGlobalBookingsLoading(true);
    try {
      const res = await api.get('/booking', {
        params: {
          where: JSON.stringify({
            start: { $lt: end },
            end: { $gt: start },
            _id: { $ne: _id },
          }),
          limit: 50,
        },
      });
      setGlobalOverlappingBookings(res?.data?.results || []);
    } catch (err) {
      setGlobalOverlappingBookings([]);
    } finally {
      setGlobalBookingsLoading(false);
    }
  };

  const [allWalletsOnChainData, setAllWalletsOnChainData] = useState<any[] | null>(null);
  const [allWalletsLoading, setAllWalletsLoading] = useState(false);
  const [yearStatus, setYearStatus] = useState<any>(null);

  const fetchYearStatus = async () => {
    if (!library || !BLOCKCHAIN_DAO_DIAMOND_ADDRESS || !BLOCKCHAIN_DIAMOND_ABI || !start) {
      return;
    }
    try {
      const Diamond = new Contract(
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
        BLOCKCHAIN_DIAMOND_ABI,
        library,
      );
      const year = dayjs(start).year();
      const [enabled, yearData] = await Diamond.getAccommodationYear(year);
      const allYears = await Diamond.getAccommodationYears();
      setYearStatus({
        year,
        enabled,
        yearData,
        allYears: allYears.map((y: any) => ({
          year: Number(y.year),
          enabled: y.enabled,
          maxDaysPerBooking: Number(y.maxDaysPerBooking),
          minDaysPerBooking: Number(y.minDaysPerBooking),
        })),
      });
    } catch (err: any) {
      setYearStatus({ error: err?.message || 'Failed to fetch year status' });
    }
  };

  const fetchAllWalletsOnChainData = async () => {
    if (!library || !BLOCKCHAIN_DAO_DIAMOND_ADDRESS || !BLOCKCHAIN_DIAMOND_ABI || !start) {
      return;
    }
    
    setAllWalletsLoading(true);
    try {
      // Get all unique wallet addresses from users who have made bookings
      const usersRes = await api.get('/user', {
        params: {
          where: JSON.stringify({
            walletAddress: { $exists: true, $ne: null },
          }),
          limit: 100,
          fields: 'walletAddress,screenname,email',
        },
      });
      const users = usersRes?.data?.results || [];
      const walletAddresses = users
        .map((u: any) => u.walletAddress)
        .filter((w: string) => w && w.startsWith('0x'));

      const Diamond = new Contract(
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
        BLOCKCHAIN_DIAMOND_ABI,
        library,
      );
      const year = dayjs(start).year();
      const requestedStartDay = dayjs(start).dayOfYear();
      const requestedEndDay = dayjs(end).dayOfYear();

      const results: any[] = [];
      
      for (const wallet of walletAddresses) {
        try {
          const bookings = await Diamond.getAccommodationBookings(wallet, year);
          const activeBookings = bookings.filter((b: any) => b.status > 0);
          
          // Check if any booking overlaps with requested dates
          const overlapping = activeBookings.filter((b: any) => {
            const bookingDay = Number(b.dayOfYear);
            return bookingDay >= requestedStartDay && bookingDay <= requestedEndDay;
          });
          
          if (overlapping.length > 0) {
            const user = users.find((u: any) => u.walletAddress?.toLowerCase() === wallet.toLowerCase());
            results.push({
              wallet,
              user: user?.screenname || user?.email || 'Unknown',
              bookings: overlapping.map((b: any) => ({
                status: Number(b.status),
                dayOfYear: Number(b.dayOfYear),
                price: b.price ? utils.formatUnits(b.price, BLOCKCHAIN_DAO_TOKEN?.decimals || 18) : '0',
                date: dayjs().year(year).dayOfYear(Number(b.dayOfYear)).format('YYYY-MM-DD'),
              })),
            });
          }
        } catch (err) {
          // Skip wallets that fail
        }
      }
      
      setAllWalletsOnChainData(results);
    } catch (err) {
      setAllWalletsOnChainData([]);
    } finally {
      setAllWalletsLoading(false);
    }
  };

  const handleTokenOnlyBooking = async () => {
    setProcessing(true);
    setPaymentError(null);
    setConflictingBookings(null);
    setBlockchainDebugInfo(null);
    setOnChainData(null);
    setGlobalOverlappingBookings(null);
    const tokenStakingResult = await payTokens(
      _id,
      dailyRentalToken?.val,
      stakeTokens,
      checkContract,
      user?.email,
      status,
      transactionId,
      { start, end, createdBy },
    );

    const { error, conflictingBookings: conflicts, sameUserBookings, otherUserBookings, debugInfo } = tokenStakingResult || {};
    if (error) {
      setProcessing(false);
      if (error === 'CONFLICTING_BOOKINGS' && conflicts) {
        setConflictingBookings({ all: conflicts, sameUser: sameUserBookings || [], otherUser: otherUserBookings || [] });
        if (otherUserBookings?.length > 0) {
          setPaymentError('A blockchain booking exists for these dates from a DIFFERENT USER. The smart contract may have a global date conflict. See details below.');
        } else {
          setPaymentError('A blockchain booking already exists for these dates from another booking. See details below.');
        }
        fetchOnChainData();
      } else if (error === 'BLOCKCHAIN_GLOBAL_CONFLICT') {
        setPaymentError('BLOCKCHAIN_GLOBAL_CONFLICT');
        setBlockchainDebugInfo(debugInfo);
        fetchOnChainData();
        fetchGlobalOverlappingBookings();
      } else if (error.includes && error.includes('blockchain') && error.includes('exists')) {
        setPaymentError(error);
        fetchOnChainData();
        fetchGlobalOverlappingBookings();
      } else {
        setPaymentError(error);
      }
      return;
    }

    try {
      await api.post('/bookings/payment', {
        isTokenOnlyBooking: true,
        _id,
      });
      onSuccess();
    } catch (error) {
      setPaymentError(parseMessageFromError(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleFriendsBookingSendToFriend = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);
      setEmailError(null);

      // Send checkout link to friend
      const res = await api.post(`/bookings/${_id}/send-to-friend`, {
        friendEmails: booking?.friendEmails,
      });

      if (res.status === 200) {
        setEmailSuccess(true);
      } else {
        setEmailSuccess(false);
        setEmailError(res.data.error);
      }
    } catch (error) {
      setEmailSuccess(false);
      setEmailError(parseMessageFromError(error));
    } finally {
      setProcessing(false);
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
      setPaymentError(parseMessageFromError(error));
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

  const refetchBooking = async () => {
    try {
      // Add a small delay to allow the backend to update the booking status
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await api.get(`/booking/${_id}`);
      const updatedBookingData = response.data.results;
      setUpdatedBooking(updatedBookingData);
      return updatedBookingData;
    } catch (error) {
      return null;
    }
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-4 md:p-6">
        <div className="relative flex items-center min-h-[2.75rem] mb-4">
          <BookingBackButton onClick={goBack} name={t('buttons_back')} className="relative z-10" />
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
            <Heading level={1} className="text-2xl md:text-3xl pb-0 mt-0 text-center">
              <span>{t('bookings_checkout_step_title')}</span>
            </Heading>
          </div>
        </div>
        {isFriend ? null : (
          <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />
        )}
        <ProgressBar
          steps={BOOKING_STEPS}
          stepHrefs={
            start && end
              ? [
                  `/bookings/create/dates?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                  `/bookings/create/accomodation?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${useTokens ? '&currency=TDF' : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                  `/bookings/${_id}/food`,
                  `/bookings/${_id}/rules`,
                  `/bookings/${_id}/questions`,
                  `/bookings/${_id}/summary`,
                  null,
                ]
              : undefined
          }
        />

        <div className="mt-6 flex flex-col gap-6">
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
              {isWeb3BookingEnabled &&
                !ticketOption?.isDayTicket &&
                !(
                  booking?.paymentDelta?.fiat &&
                  booking?.paymentDelta?.fiat?.val > 0
                ) && (
                  <div className="flex flex-col gap-2">
                    <div
                      className="flex flex-col gap-1"
                      title={
                        currency === CURRENCIES[1]
                          ? t('bookings_payment_tdf_tooltip')
                          : undefined
                      }
                    >
                      <CurrencySwitcher
                        selectedCurrency={currency}
                        onSelect={setCurrency as any}
                        currencies={CURRENCIES}
                        optionsTitles={CURRENCIES.map((c) =>
                          t(`currency_switch_${c}_title`),
                        )}
                      />
                    </div>
                    {currency === CURRENCIES[1] && isWalletReady && (
                      <p className="text-sm text-foreground">
                        {t('bookings_payment_wallet_balance')}:{' '}
                        <span className="font-semibold">
                          {priceFormat(tokenBalanceAvailable, CURRENCIES[1])}
                        </span>
                      </p>
                    )}
                    {currency === CURRENCIES[1] && (
                      <p className="text-xs text-foreground">
                        {t('bookings_payment_tdf_tooltip')}
                      </p>
                    )}
                  </div>
                )}
              {!(
                booking?.paymentDelta?.fiat &&
                booking?.paymentDelta?.fiat?.val > 0
              ) && (
                <>
                  <div>
                    {eventPrice && (
                      <div>
                        <HeadingRow>
                          <IconPartyPopper />
                          <span>{t('bookings_checkout_ticket_cost')}</span>
                        </HeadingRow>
                        <div className="mb-6 mt-2">
                          <Row
                            rowKey={ticketOption?.name}
                            value={`${priceFormat(
                              eventFiat?.val,
                              eventFiat?.cur,
                            )}`}
                          />
                        </div>
                      </div>
                    )}
                    {!ticketOption?.isDayTicket && (
                      <>
                        <HeadingRow>
                          <IconHome />
                          <span>
                            {isHourlyBooking
                              ? t('bookings_checkout_step_accomodation')
                              : t('bookings_checkout_step_hourly')}
                          </span>
                        </HeadingRow>
                        <div className="flex justify-between items-center mt-2">
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
                              {useCredits &&
                                booking?.status !== 'credits-paid' && (
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
                            : t(
                                'bookings_checkout_step_accomodation_description',
                              )}
                        </p>
                      </>
                    )}

                    {process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true' &&
                    canApplyCredits &&
                    !useTokens &&
                    !booking?.volunteerId &&
                    ((rentalFiat && rentalFiat?.val > 0) || useCredits) &&
                    status !== 'credits-paid' ? (
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
                            ? Math.round(
                                (dailyRentalToken?.val || 0) *
                                  (duration || 0) *
                                  (adults || 0) *
                                  100,
                              ) / 100
                            : Math.round(
                                (dailyRentalToken?.val || 0) *
                                  (duration || 0) *
                                  (adults || 0) *
                                  100,
                              ) / 100,
                          cur: CloserCurrencies.TDF,
                        }}
                        applyCredits={applyCredits}
                        hasAppliedCredits={
                          useCredits || status === 'credits-paid'
                        }
                        creditsError={creditsError}
                        className="my-4"
                      />
                    ) : null}

                    {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' &&
                      rentalToken &&
                      rentalToken?.val > 0 &&
                      useTokens &&
                      status !== 'tokens-staked' && (
                        <div className="mt-2">
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
                  <div className="rounded-lg border border-neutral-dark bg-neutral-light p-4">
                    {!isHourlyBooking &&
                    utilityFiat?.val &&
                    bookingConfig?.utilityOptionEnabled ? (
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          {t('bookings_checkout_step_utility_title')}
                        </p>
                        <p className="font-bold text-sm">
                          {priceFormat(utilityFiat)}
                        </p>
                      </div>
                    ) : null}
                    {!isHourlyBooking && foodFiat?.val ? (
                      <div
                        className={`flex justify-between items-center ${
                          utilityFiat?.val && bookingConfig?.utilityOptionEnabled
                            ? 'mt-2'
                            : ''
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {t('bookings_checkout_step_food_title')}
                        </p>
                        <p className="font-bold text-sm">
                          {booking?.foodOptionId
                            ? priceFormat(foodFiat)
                            : t('bookings_food_not_included')}
                        </p>
                      </div>
                    ) : null}
                    <div
                      className={
                        (utilityFiat?.val &&
                          bookingConfig?.utilityOptionEnabled) ||
                        foodFiat?.val
                          ? 'border-t border-neutral-dark/30 mt-2 pt-2'
                          : ''
                      }
                    >
                      <CheckoutTotal
                        total={
                          booking?.paymentDelta?.fiat &&
                          booking?.paymentDelta?.fiat?.val > 0
                            ? booking?.paymentDelta?.fiat
                            : total
                        }
                        useTokens={useTokens || false}
                        useCredits={
                          (useCredits && status !== 'credits-paid') || false
                        }
                        rentalToken={rentalToken}
                        vatRate={vatRate}
                        priceInCredits={priceInCredits}
                        compact
                      />
                    </div>
                    {!isHourlyBooking &&
                      ((utilityFiat?.val &&
                        bookingConfig?.utilityOptionEnabled) ||
                        foodFiat?.val) && (
                        <p className="text-right text-xs mt-1 text-foreground/80">
                          {t('bookings_summary_step_utility_description')}
                        </p>
                      )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="rounded-lg border-2 border-neutral-dark bg-neutral-light p-4 sm:p-6 flex flex-col gap-3">
            {status === 'tokens-staked' && useTokens && rentalToken && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-0">
                <div className="flex ">
                  <IconCheckCircle className="text-green-600 mr-2" />
                  <p className="text-green-800 font-medium text-sm">
                    {t.rich('bookings_checkout_tokens_staked_message', {
                      tokens: String(
                        priceFormat({
                          val:
                            paymentType === PaymentType.PARTIAL_TOKENS
                              ? partialPriceInTokens
                              : rentalToken.val,
                          cur: rentalToken.cur,
                        }),
                      ),
                    })}
                  </p>
                </div>
              </div>
            )}
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
                    (!hasAgreedToWalletDisclaimer ||
                      (isNotEnoughBalance &&
                        booking?.status !== 'tokens-staked'))) ||
                  false
                }
                useTokens={useTokens || false}
                useCredits={useCredits}
                totalToPayInFiat={totalToPayInFiat}
                dailyTokenValue={dailyRentalToken?.val || 0}
                startDate={start}
                endDate={end}
                rentalTokenVal={
                  dailyRentalToken?.val || 0 * (nightsToPayWithTokens || 0)
                }
                totalNights={nightsToPayWithTokens}
                user={user}
                eventId={event?._id}
                status={booking?.status}
                transactionId={booking?.transactionId}
                createdBy={booking?.createdBy}
                shouldShowTokenDisclaimer={shouldShowTokenDisclaimer}
                hasAgreedToWalletDisclaimer={hasAgreedToWalletDisclaimer}
                setWalletDisclaimer={setWalletDisclaimer}
                refetchBooking={refetchBooking}
                isAdditionalFiatPayment={isAdditionalFiatPayment}
              />
            )}
          </div>
          {isFriendsBooking && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                {!isFriend && (
                  <Button
                    isEnabled={!processing}
                    onClick={handleFriendsBookingSendToFriend}
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="mr-0 shrink-0" />
                      {t('friends_booking_send_to_friend')}
                    </span>
                  </Button>
                )}

                {emailSuccess && (
                  <div className="text-green-600 text-sm font-medium inline-flex items-center gap-2">
                    <IconCheckCircle className="shrink-0 text-green-600" />
                    {t('friends_booking_checkout_sent')}
                  </div>
                )}

                {emailError && (
                  <div className="text-red-600 text-sm font-medium inline-flex items-center gap-2">
                    <IconXCircle className="shrink-0 text-red-600" />
                    {emailError}
                  </div>
                )}
              </div>
            </div>
          )}
          {isFreeBooking && !isFriendsBooking && (
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
          {isTokenOnlyBooking && !isFriendsBooking && (
            <div>
              <Checkbox
                id="token-staking-disclaimer"
                isChecked={hasAgreedToWalletDisclaimer}
                onChange={() =>
                  setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                }
                className="mt-8"
              >
                {t('bookings_checkout_step_wallet_disclaimer')}
              </Checkbox>
              <Button
                isEnabled={
                  !processing && !isStaking && hasAgreedToWalletDisclaimer
                }
                className="booking-btn"
                onClick={handleTokenOnlyBooking}
              >
                {renderButtonText()}
              </Button>
            </div>
          )}
          {paymentError && paymentError !== 'BLOCKCHAIN_GLOBAL_CONFLICT' && (
            <ErrorMessage error={paymentError} />
          )}
          
          {paymentError === 'BLOCKCHAIN_GLOBAL_CONFLICT' && blockchainDebugInfo && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="font-semibold text-red-800 mb-2">
                ⚠️ Blockchain Global Date Conflict
              </p>
              <p className="text-sm text-red-700 mb-3">
                {blockchainDebugInfo.message}
              </p>
              <p className="text-sm font-semibold text-red-700 mb-2">Possible causes:</p>
              <ul className="list-disc list-inside text-sm text-red-600 mb-3 space-y-1">
                {blockchainDebugInfo.possibleCauses?.map((cause: string, idx: number) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
              <div className="bg-white p-3 rounded border text-sm">
                <p><strong>Requested dates:</strong></p>
                <p>Start: {blockchainDebugInfo.dates?.start ? dayjs(blockchainDebugInfo.dates.start).format('MMM D, YYYY HH:mm') : 'N/A'}</p>
                <p>End: {blockchainDebugInfo.dates?.end ? dayjs(blockchainDebugInfo.dates.end).format('MMM D, YYYY HH:mm') : 'N/A'}</p>
                <p className="mt-2 text-gray-500">
                  Day of year range: {blockchainDebugInfo.dates?.start ? dayjs(blockchainDebugInfo.dates.start).dayOfYear() : '?'} 
                  - {blockchainDebugInfo.dates?.end ? dayjs(blockchainDebugInfo.dates.end).dayOfYear() : '?'}
                </p>
              </div>
              <p className="text-xs text-red-600 mt-3">
                The smart contract appears to enforce global date uniqueness across all wallets. 
                Another user may have already staked tokens for these dates. Please contact support.
              </p>
            </div>
          )}
          
          {conflictingBookings && conflictingBookings.all?.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-800 mb-2">
                Debug: Conflicting blockchain bookings found ({conflictingBookings.all.length} total)
              </p>
              
              {conflictingBookings.otherUser?.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-red-700 mt-3 mb-2">
                    ⚠️ Bookings from OTHER USERS ({conflictingBookings.otherUser.length}):
                  </p>
                  <p className="text-xs text-red-600 mb-2">
                    These bookings are from different users but have the same dates. 
                    The smart contract may be enforcing global date uniqueness (not per-user).
                  </p>
                  <div className="space-y-2">
                    {conflictingBookings.otherUser.map((b: any) => (
                      <div key={b._id} className="p-3 bg-red-50 rounded border border-red-200 text-sm">
                        <p><strong>Booking ID:</strong> {b._id}</p>
                        <p><strong>Created By:</strong> {b.createdBy}</p>
                        <p><strong>Dates:</strong> {dayjs(b.start).format('MMM D, YYYY')} - {dayjs(b.end).format('MMM D, YYYY')}</p>
                        <p><strong>Status:</strong> {b.status}</p>
                        <p><strong>Transaction ID:</strong> <code className="text-xs bg-gray-100 px-1">{b.transactionId}</code></p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {conflictingBookings.sameUser?.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-amber-700 mt-3 mb-2">
                    Your other bookings with same dates ({conflictingBookings.sameUser.length}):
                  </p>
                  <div className="space-y-2">
                    {conflictingBookings.sameUser.map((b: any) => (
                      <div key={b._id} className="p-3 bg-white rounded border text-sm">
                        <p><strong>Booking ID:</strong> {b._id}</p>
                        <p><strong>Dates:</strong> {dayjs(b.start).format('MMM D, YYYY')} - {dayjs(b.end).format('MMM D, YYYY')}</p>
                        <p><strong>Status:</strong> {b.status}</p>
                        <p><strong>Transaction ID:</strong> <code className="text-xs bg-gray-100 px-1">{b.transactionId}</code></p>
                        <a 
                          href={`/bookings/${b._id}`}
                          className="text-blue-600 underline hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View booking →
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <p className="text-xs text-amber-600 mt-3">
                This is a smart contract limitation. Please contact support for assistance.
              </p>
            </div>
          )}
          {paymentError && (paymentError.includes('blockchain') || paymentError === 'BLOCKCHAIN_GLOBAL_CONFLICT') && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-purple-800">
                  Contract: Year Status
                </p>
                <button
                  onClick={fetchYearStatus}
                  className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded"
                >
                  {yearStatus ? 'Refresh' : 'Check year status'}
                </button>
              </div>
              {yearStatus?.error && (
                <p className="text-sm text-red-600">{yearStatus.error}</p>
              )}
              {yearStatus && !yearStatus.error && (
                <div className="text-sm mb-3">
                  <p><strong>Year {yearStatus.year}:</strong> {yearStatus.enabled ? '✓ Enabled' : '✗ NOT ENABLED'}</p>
                  {yearStatus.allYears && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-purple-600">All configured years ({yearStatus.allYears.length})</summary>
                      <div className="mt-1 ml-4 text-xs">
                        {yearStatus.allYears.map((y: any) => (
                          <p key={y.year}>
                            {y.year}: {y.enabled ? '✓' : '✗'} (min: {y.minDaysPerBooking}, max: {y.maxDaysPerBooking} days)
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
              
              <div className="border-t border-blue-200 pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-blue-800">
                    Debug: On-chain data {account && `for ${account.slice(0, 6)}...${account.slice(-4)}`}
                  </p>
                  <button
                    onClick={fetchOnChainData}
                    disabled={onChainLoading}
                    className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded disabled:opacity-50"
                  >
                    {onChainLoading ? 'Loading...' : (onChainData ? 'Refresh' : 'Load on-chain data')}
                  </button>
                </div>
              </div>
              
              {onChainLoading && (
                <p className="text-sm text-blue-600">Fetching on-chain data...</p>
              )}
              
              {onChainError && (
                <p className="text-sm text-red-600">{onChainError}</p>
              )}
              
              {!onChainLoading && !onChainError && !onChainData && (
                <p className="text-sm text-blue-600">Click the button to load on-chain booking data for your wallet.</p>
              )}
              
              {onChainData && onChainData.length === 0 && (
                <p className="text-sm text-blue-600">No bookings found on-chain for {dayjs(start).year()}.</p>
              )}
              
              {onChainData && onChainData.length > 0 && (
                <>
                  <p className="text-sm text-blue-700 mb-3">
                    Bookings stored on the blockchain for your wallet in {dayjs(start).year()}:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Day of Year</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Price (TDF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onChainData.map((b: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                            <td className="px-3 py-2">{b.date}</td>
                            <td className="px-3 py-2">{b.dayOfYear}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                b.status === 1 ? 'bg-yellow-200 text-yellow-800' :
                                b.status === 2 ? 'bg-green-200 text-green-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {b.status === 1 ? 'Booked' : b.status === 2 ? 'Checked-in' : `Status ${b.status}`}
                              </span>
                            </td>
                            <td className="px-3 py-2">{b.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    Current booking dates: {dayjs(start).format('YYYY-MM-DD')} to {dayjs(end).format('YYYY-MM-DD')} 
                    (Days {dayjs(start).dayOfYear()} - {dayjs(end).dayOfYear()})
                  </p>
                </>
              )}
              
              {account && (
                <p className="text-xs text-gray-500 mt-2">
                  Wallet: {account}
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-blue-800">
                    Database: All overlapping bookings
                  </p>
                  <button
                    onClick={fetchGlobalOverlappingBookings}
                    disabled={globalBookingsLoading}
                    className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded disabled:opacity-50"
                  >
                    {globalBookingsLoading ? 'Loading...' : (globalOverlappingBookings ? 'Refresh' : 'Load from DB')}
                  </button>
                </div>
                
                {globalBookingsLoading && (
                  <p className="text-sm text-blue-600">Fetching bookings from database...</p>
                )}
                
                {!globalBookingsLoading && !globalOverlappingBookings && (
                  <p className="text-sm text-blue-600">Click to load all bookings with overlapping dates from the database.</p>
                )}
                
                {globalOverlappingBookings && globalOverlappingBookings.length === 0 && (
                  <p className="text-sm text-blue-600">No overlapping bookings found in database.</p>
                )}
                
                {globalOverlappingBookings && globalOverlappingBookings.length > 0 && (
                  <>
                    <p className="text-sm text-blue-700 mb-2">
                      Found {globalOverlappingBookings.length} booking(s) with overlapping dates:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {globalOverlappingBookings.map((b: any) => (
                        <div key={b._id} className={`p-3 rounded border text-sm ${b.transactionId ? 'bg-yellow-50 border-yellow-300' : 'bg-white'}`}>
                          <p><strong>ID:</strong> {b._id}</p>
                          <p><strong>Dates:</strong> {dayjs(b.start).format('MMM D, YYYY')} - {dayjs(b.end).format('MMM D, YYYY')}</p>
                          <p><strong>Days:</strong> {dayjs(b.start).dayOfYear()} - {dayjs(b.end).dayOfYear()}</p>
                          <p><strong>Status:</strong> {b.status}</p>
                          <p><strong>Created By:</strong> {b.createdBy}</p>
                          {b.transactionId ? (
                            <p className="text-yellow-700"><strong>Transaction ID:</strong> <code className="text-xs bg-yellow-100 px-1">{b.transactionId}</code></p>
                          ) : (
                            <p className="text-gray-500"><strong>Transaction ID:</strong> None (not on-chain)</p>
                          )}
                          {b.walletAddress && (
                            <p><strong>Wallet:</strong> {b.walletAddress}</p>
                          )}
                          <a 
                            href={`/bookings/${b._id}`}
                            className="text-blue-600 underline hover:text-blue-800 text-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View booking →
                          </a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-red-800">
                    On-chain: ALL wallets with overlapping dates
                  </p>
                  <button
                    onClick={fetchAllWalletsOnChainData}
                    disabled={allWalletsLoading}
                    className="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded disabled:opacity-50"
                  >
                    {allWalletsLoading ? 'Scanning...' : (allWalletsOnChainData ? 'Rescan' : 'Scan all wallets')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Scans on-chain bookings from all known wallet addresses in the database for days {dayjs(start).dayOfYear()}-{dayjs(end).dayOfYear()}.
                </p>
                
                {allWalletsLoading && (
                  <p className="text-sm text-red-600">Scanning all wallets on-chain... This may take a moment.</p>
                )}
                
                {!allWalletsLoading && !allWalletsOnChainData && (
                  <p className="text-sm text-red-600">Click to scan ALL known wallets for on-chain bookings on these dates.</p>
                )}
                
                {allWalletsOnChainData && allWalletsOnChainData.length === 0 && (
                  <p className="text-sm text-green-600">✓ No on-chain bookings found from any known wallet for these dates.</p>
                )}
                
                {allWalletsOnChainData && allWalletsOnChainData.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-red-700 mb-2">
                      ⚠️ Found {allWalletsOnChainData.length} wallet(s) with on-chain bookings for these dates:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allWalletsOnChainData.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-red-50 rounded border border-red-300 text-sm">
                          <p><strong>Wallet:</strong> <code className="text-xs bg-red-100 px-1">{item.wallet}</code></p>
                          <p><strong>User:</strong> {item.user}</p>
                          <p><strong>On-chain bookings:</strong></p>
                          <div className="ml-4 mt-1 space-y-1">
                            {item.bookings.map((b: any, bIdx: number) => (
                              <div key={bIdx} className="text-xs bg-white p-2 rounded">
                                <span className="font-mono">{b.date}</span> (Day {b.dayOfYear}) - 
                                <span className={`ml-1 px-1 rounded ${
                                  b.status === 1 ? 'bg-yellow-200' : b.status === 2 ? 'bg-green-200' : 'bg-gray-200'
                                }`}>
                                  {b.status === 1 ? 'Booked' : b.status === 2 ? 'Checked-in' : `Status ${b.status}`}
                                </span>
                                - {b.price} TDF
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
