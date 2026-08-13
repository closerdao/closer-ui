import { useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { WalletState } from '../contexts/wallet';
import { CitizenshipConfig } from '../types';
import { Booking } from '../types/booking';
import { CitizenApplication } from '../types/subscriptions';
import api from '../utils/api';
import { getCachedConfig } from '../utils/cachedConfig.helpers';

/**
 * Booking statuses that count as a stay, mirroring
 * `checkHasStayedForMinDuration` on the API.
 */
const STAYED_BOOKING_STATUSES = [
  'tokens-staked',
  'credits-paid',
  'paid',
  'checked-in',
  'checked-out',
  'pending-refund',
];

/** Past bookings are only summed up for the counter, a handful is enough. */
const BOOKINGS_TO_SUM_LIMIT = 10;

export interface CitizenQuestsState {
  /** Citizenship config values, with defaults applied. */
  tokensRequired: number;
  minVouches: number;
  minStayDuration: number;
  isSpaceHostVouchRequired?: boolean;

  /** Quest completion. */
  hasStayedForMinDuration: boolean;
  totalStayDays: number;
  presenceProgress: number;
  isVouched: boolean;
  vouchCount: number;
  ownsRequiredTokens: boolean;
  isTokensComplete: boolean;
  hasNoReports: boolean;
  isEligible: boolean;
  tokensProgress: number;

  /** Wallet. */
  balanceTotal: number;
  proofOfPresence: number;
  isWalletConnected: boolean;
  isCorrectNetwork: boolean;
  hasSameConnectedAccount: boolean;
  /**
   * True when the connected wallet is the user's own and on the right network,
   * i.e. when the on-chain balances above can be trusted over the cached
   * `user.stats.wallet` numbers.
   */
  hasLiveWalletBalances: boolean;

  /** Local application draft (token intent). */
  application: CitizenApplication;
  updateApplication: (
    key: keyof CitizenApplication,
    value: CitizenApplication[keyof CitizenApplication],
  ) => void;

  isMember: boolean;
}

/**
 * Single source of truth for the citizenship quests ("Presence", "Tokens",
 * "Vouching"). Used by the application flow at
 * `/citizenship/validation` and by the `citizenshipStatus` page
 * editor block so both stay in sync.
 */
export const useCitizenQuests = (): CitizenQuestsState => {
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;

  const {
    balanceTotal,
    proofOfPresence,
    isWalletConnected,
    isCorrectNetwork,
    hasSameConnectedAccount,
  } = useContext(WalletState);

  const tokensRequired = citizenshipConfig?.tokensRequired ?? 30;
  const minVouches = citizenshipConfig?.minVouches ?? 3;
  const minStayDuration = citizenshipConfig?.minVouchingStayDuration ?? 14;
  const isSpaceHostVouchRequired = citizenshipConfig?.isSpaceHostVouchRequired;

  const ownsRequiredTokens = (balanceTotal || 0) >= tokensRequired;
  const isMember = Boolean(user?.roles?.includes('member'));

  const [isVouched, setIsVouched] = useState(false);
  const [hasStayedPerApi, setHasStayedPerApi] = useState(false);
  const [application, setApplication] = useState<CitizenApplication>({
    ownsRequiredTokens,
    why: user?.citizenship?.why || '',
    hasSelectedTokenIntent: false,
    intent: {
      iWantToApply: Boolean(ownsRequiredTokens) && !isMember,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: false,
    },
  });

  const vouchCount = user?.vouched?.length || 0;

  // The API only answers "have they stayed long enough?", but the quest card
  // shows how far along the stay is, so the nights are summed here too — with
  // the same filter the API uses, so the counter and the tick agree.
  const pastBookingsFilter = useMemo(
    () => ({
      where: {
        createdBy: user?._id,
        status: STAYED_BOOKING_STATUSES,
        end: { $lt: new Date() },
      },
      sort: '-end',
      limit: BOOKINGS_TO_SUM_LIMIT,
    }),
    [user?._id],
  );

  const pastBookings = platform?.booking?.find(pastBookingsFilter);

  const totalStayDays =
    pastBookings
      ?.toJS()
      ?.reduce(
        (acc: number, booking: Booking) => acc + (booking.duration || 0),
        0,
      ) || 0;

  const hasStayedForMinDuration =
    hasStayedPerApi ||
    (minStayDuration > 0 && totalStayDays >= minStayDuration);

  const presenceProgress = hasStayedForMinDuration
    ? 1
    : minStayDuration <= 0
    ? 1
    : Math.min(1, totalStayDays / minStayDuration);

  const hasNoReports =
    (user?.reportedBy?.length === 0 || !user?.reportedBy) &&
    (user?.reports?.length === 0 || !user?.reports);

  const isTokensComplete =
    ownsRequiredTokens ||
    (application.hasSelectedTokenIntent &&
      (Boolean(application.intent.iWantToBuyTokens) ||
        Boolean(application.intent.iWantToFinanceTokens)));

  const tokensProgress = Math.min(1, (balanceTotal || 0) / tokensRequired);

  const isEligible =
    hasStayedForMinDuration && isVouched && ownsRequiredTokens && hasNoReports;

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    (async () => {
      try {
        const hasStayedRes = await api.get(
          '/subscription/citizen/check-has-stayed-for-min-duration',
        );

        setHasStayedPerApi(
          Boolean(hasStayedRes?.data?.hasStayedForMinDuration),
        );

        const isVouchedRes = await api.get(
          '/subscription/citizen/check-is-vouched',
        );

        setIsVouched(Boolean(isVouchedRes?.data?.isVouched));
      } catch (error) {}
    })();
  }, [ownsRequiredTokens, isMember, user?._id]);

  useEffect(() => {
    if (!user?._id || !platform?.booking) {
      return;
    }

    platform.booking.get(pastBookingsFilter).catch(() => {});
  }, [pastBookingsFilter, user?._id]);

  useEffect(() => {
    if (ownsRequiredTokens) {
      setApplication((prev) => ({
        ...prev,
        ownsRequiredTokens,
        intent: {
          ...prev.intent,
          iWantToApply: !isMember,
          iWantToFinanceTokens: false,
          iWantToBuyTokens: false,
        },
      }));
    }
  }, [ownsRequiredTokens, isMember]);

  const updateApplication = (
    key: keyof CitizenApplication,
    value: CitizenApplication[keyof CitizenApplication],
  ) => {
    setApplication((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'intent' ? { hasSelectedTokenIntent: true } : {}),
    }));
  };

  return {
    tokensRequired,
    minVouches,
    minStayDuration,
    isSpaceHostVouchRequired,
    hasStayedForMinDuration,
    totalStayDays,
    presenceProgress,
    isVouched,
    vouchCount,
    ownsRequiredTokens,
    isTokensComplete,
    hasNoReports,
    isEligible,
    tokensProgress,
    balanceTotal: balanceTotal || 0,
    proofOfPresence: proofOfPresence || 0,
    isWalletConnected: Boolean(isWalletConnected),
    isCorrectNetwork: Boolean(isCorrectNetwork),
    hasSameConnectedAccount: Boolean(hasSameConnectedAccount),
    hasLiveWalletBalances: Boolean(
      isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
    ),
    application,
    updateApplication,
    isMember,
  };
};
