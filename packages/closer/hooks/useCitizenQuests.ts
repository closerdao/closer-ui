import { useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { CitizenshipConfig } from '../types';
import {
  CitizenApplication,
  FinanceApplication,
} from '../types/subscriptions';
import api, { formatSearch } from '../utils/api';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { useOpenFinanceApplications } from './useOpenFinanceApplications';

/**
 * Statuses under which a financed plan counts towards citizenship — the API
 * grants the role once a plan is 'paid' (deposit made) or fully repaid, so the
 * quests mirror that rather than counting plans still awaiting their deposit.
 * These are the only three the API ever writes ('pending-payment' being the
 * third); 'up-to-date' used to be listed here but nothing sets it, so a plan
 * could never match it.
 */
const QUALIFYING_FINANCE_STATUSES: FinanceApplication['status'][] = [
  'paid',
  'completed',
];

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

  /** In-progress financed token plans (any open status), newest first. */
  openFinanceApplications: FinanceApplication[];
  /** Tokens financed under plans whose deposit is paid. */
  financedTokens: number;
  /**
   * True when active financed plans (deposit paid) cover the token
   * requirement together with the wallet balance, so the tokens quest is
   * satisfied without buying or financing again.
   */
  isTokensCoveredByFinancePlan: boolean;

  /** Wallet. */
  balanceTotal: number;
  /**
   * The balance the token requirement is judged on: the connected wallet when
   * it is the user's own on the right network, otherwise the `stats.wallet`
   * snapshot — the same fallback the API applies.
   */
  tokenBalance: number;
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
  const minStayDuration = citizenshipConfig?.minVouchingStayDuration ?? 14;
  const isSpaceHostVouchRequired = citizenshipConfig?.isSpaceHostVouchRequired;

  const hasLiveWalletBalances = Boolean(
    isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
  );

  // The API judges the token requirement on the wallet linked to the account,
  // reading the chain and falling back to the `stats.wallet` snapshot. Mirror
  // that: trust the connected wallet only when it is the user's own on the
  // right network, and otherwise use the same cached snapshot the API would.
  // Reading the connected wallet unconditionally meant someone could satisfy
  // the quest with a wallet the API has never heard of.
  const cachedTokenBalance = Number(user?.stats?.wallet?.tdf) || 0;
  const tokenBalance = hasLiveWalletBalances
    ? balanceTotal || 0
    : cachedTokenBalance;

  const ownsRequiredTokens = tokenBalance >= tokensRequired;
  const isMember = Boolean(user?.roles?.includes('member'));

  const { applications: openFinanceApplications } =
    useOpenFinanceApplications();
  const financedTokens = useMemo(
    () =>
      openFinanceApplications
        .filter((row) => QUALIFYING_FINANCE_STATUSES.includes(row.status))
        .reduce((acc, row) => acc + (row.tokensToFinance || 0), 0),
    [openFinanceApplications],
  );
  const isTokensCoveredByFinancePlan =
    financedTokens > 0 && tokenBalance + financedTokens >= tokensRequired;
  const hasRequiredTokensOrPlan =
    ownsRequiredTokens || isTokensCoveredByFinancePlan;

  const [isVouched, setIsVouched] = useState(false);
  const [hasStayedPerApi, setHasStayedPerApi] = useState(false);
  const [totalCitizens, setTotalCitizens] = useState(0);
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

  // Verified presence comes from the same endpoint that decides the gate, so
  // the card can never read "0 of 14 nights" next to a passing quest. Older API
  // builds answered without the count, hence the `/stays/nights/:userId`
  // fallback — the source the check itself now uses.
  const [totalStayDays, setTotalStayDays] = useState(0);
  const minVouches = Math.max(1, Math.round(totalCitizens * 0.1));

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
    hasRequiredTokensOrPlan ||
    (application.hasSelectedTokenIntent &&
      (Boolean(application.intent.iWantToBuyTokens) ||
        Boolean(application.intent.iWantToFinanceTokens)));

  const tokensProgress = Math.min(
    1,
    (tokenBalance + financedTokens) / tokensRequired,
  );

  const isEligible =
    hasStayedForMinDuration &&
    isVouched &&
    hasRequiredTokensOrPlan &&
    hasNoReports;

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    (async () => {
      try {
        const [hasStayedRes, isVouchedRes, staysRes, citizensCountRes] =
          await Promise.all([
            api.get('/subscription/citizen/check-has-stayed-for-min-duration'),
            api.get('/subscription/citizen/check-is-vouched'),
            api.get(`/stays/nights/${user._id}`),
            api.get('/count/user', {
              params: {
                where: formatSearch({
                  roles: { $in: ['member', 'citizen'] },
                }),
              },
            }),
          ]);

        setHasStayedPerApi(
          Boolean(hasStayedRes?.data?.hasStayedForMinDuration),
        );
        setIsVouched(Boolean(isVouchedRes?.data?.isVouched));
        // The stays routes wrap their payload in `results`.
        setTotalStayDays(
          Number(
            hasStayedRes?.data?.totalNights ??
              staysRes?.data?.results?.totalNights ??
              staysRes?.data?.totalNights,
          ) || 0,
        );
        setTotalCitizens(Number(citizensCountRes?.data?.results) || 0);
      } catch (error) {}
    })();
  }, [ownsRequiredTokens, isMember, user?._id]);

  useEffect(() => {
    // Covered people (own tokens, or an active plan already covers them) have
    // nothing left to buy or finance, so the intent collapses to applying.
    if (hasRequiredTokensOrPlan) {
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
  }, [hasRequiredTokensOrPlan, ownsRequiredTokens, isMember]);

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
    tokenBalance,
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
    openFinanceApplications,
    financedTokens,
    isTokensCoveredByFinancePlan,
    balanceTotal: balanceTotal || 0,
    proofOfPresence: proofOfPresence || 0,
    isWalletConnected: Boolean(isWalletConnected),
    isCorrectNetwork: Boolean(isCorrectNetwork),
    hasSameConnectedAccount: Boolean(hasSameConnectedAccount),
    hasLiveWalletBalances,
    application,
    updateApplication,
    isMember,
  };
};
