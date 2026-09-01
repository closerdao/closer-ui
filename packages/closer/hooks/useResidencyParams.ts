import { useContext, useEffect, useMemo, useState } from 'react';

import { blockchainConfig } from '../config_blockchain';
import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { FoodOption } from '../types/food';
import {
  ResidencyMissingSetting,
  ResidencyParams,
  ResidencyStanding,
} from '../types/residency';
import { getCurrentUnitPrice } from '../utils/bondingCurve';
import { getCachedConfig, getSavedConfig } from '../utils/cachedConfig.helpers';
import {
  getResidencyLivingCosts,
  parseResidencyConfig,
} from '../utils/residency.helpers';
import { useBuyTokens } from './useBuyTokens';
import { usePresenceToken } from './usePresenceToken';
import { useSweatToken } from './useSweatToken';

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The parameters half of the volunteer season tool: the association's own
 * `residency` config, plus what the platform's booking setup says the program
 * provides.
 *
 * The $TDF price off the bonding curve is in here, and never leaves: it turns
 * the association's budget for a role into a number of tokens, and that number
 * is all the volunteer is shown. Quoting the euros behind it would put a price
 * on the one thing that must not have one — the token has no liquid market, so
 * an allocation of it is worth nothing to receive.
 *
 * `params` is null until the platform has stated every setting the season
 * needs; `missing` then names what it is still waiting for.
 */
export const useResidencyParams = (
  /** The platform's food options, for the board half of the program's costs. */
  foodOptions?: FoodOption[] | null,
): {
  params: ResidencyParams | null;
  missing: ResidencyMissingSetting[];
  isEnabled: boolean;
  isLoading: boolean;
} => {
  /*
   * Two reads of the same document, for two different questions. `enabled`
   * comes off the merged view so a platform that has only set
   * `NEXT_PUBLIC_FEATURE_RESIDENCY` still counts as switched on; every value
   * the season is laid out from comes off the document as saved, where an
   * unset field is absent rather than silently zero.
   *
   * All three are memoized: each call returns a fresh object, which would
   * otherwise re-parse the config on every render.
   */
  const enabledConfig = useMemo(() => getCachedConfig('residency'), []);
  const config = useMemo(() => getSavedConfig('residency'), []);
  const bookingConfig = useMemo(() => getSavedConfig('booking'), []);

  /*
   * What the program provides, and what that costs it, is answered by the
   * platform's own booking setup — not by a second set of numbers in the
   * residency config, where they would drift out of step with the first.
   */
  const living = useMemo(
    () => getResidencyLivingCosts(bookingConfig, foodOptions),
    [bookingConfig, foodOptions],
  );

  const { getCurrentSupplyWithoutWallet } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const supply = await getCurrentSupplyWithoutWallet();
        if (isCancelled) return;
        if (supply && supply > 0) {
          setTokenPrice(getCurrentUnitPrice(supply));
        }
      } catch (error) {
        console.error('Could not read the token price on chain:', error);
      } finally {
        if (!isCancelled) setIsLoadingPrice(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [getCurrentSupplyWithoutWallet]);

  const { params, missing } = useMemo(
    () => parseResidencyConfig(config, tokenPrice, tokenPrice !== null, living),
    [config, tokenPrice, living],
  );

  return {
    params,
    // The price is still on its way in, so do not report it as unset yet.
    missing: isLoadingPrice
      ? missing.filter((setting) => setting !== 'tokenPrice')
      : missing,
    isEnabled: Boolean(enabledConfig?.enabled),
    isLoading: isLoadingPrice,
  };
};

/**
 * The member's standing, in the order the rest of the app trusts it: the
 * balances cached on the user by the API, overridden by a live on-chain read
 * only when the connected wallet is the user's own and on the right network.
 *
 * The cached numbers mean the tool prices a season for a signed-in member who
 * has never connected a wallet — connecting only sharpens $Presence and the DAO
 * token, and $Sweat has no on-chain read at all here.
 */
export const useResidencyStanding = (): {
  standing: ResidencyStanding;
  /** True while the numbers above came off chain rather than the user record. */
  hasLiveBalances: boolean;
  isLoading: boolean;
} => {
  const { user } = useAuth();
  const {
    isWalletConnected,
    isWalletReady,
    isCorrectNetwork,
    hasSameConnectedAccount,
    balanceTotal,
  } = useContext(WalletState);
  const { presenceBalance, isLoading: isLoadingPresence } = usePresenceToken();
  const { sweatBalance, isLoading: isLoadingSweat } = useSweatToken();

  const hasLiveBalances = Boolean(
    isWalletConnected &&
      isWalletReady &&
      isCorrectNetwork &&
      hasSameConnectedAccount,
  );

  const standing = useMemo<ResidencyStanding>(() => {
    const cached = (user as any)?.stats?.wallet ?? {};
    const cachedPresence = toNumber(cached.presence ?? (user as any)?.presence);
    const cachedTokens = toNumber(cached.tdf);
    const cachedSweat = toNumber(cached.sweat);

    return {
      presence: Math.floor(
        hasLiveBalances ? toNumber(presenceBalance) : cachedPresence,
      ),
      tokensHeld: Math.floor(
        hasLiveBalances ? toNumber(balanceTotal) : cachedTokens,
      ),
      // No on-chain $Sweat read is wired up for a foreign wallet, so a live
      // read only replaces the cache when it actually returned something.
      sweat: Math.floor(
        hasLiveBalances && toNumber(sweatBalance) > 0
          ? toNumber(sweatBalance)
          : cachedSweat,
      ),
      // Spending needs a wallet, so the cached figure — good enough to show a
      // balance and place someone on the tier ladder — can never back a lock.
      lockableTokens: hasLiveBalances ? Math.floor(toNumber(balanceTotal)) : 0,
    };
  }, [user, hasLiveBalances, presenceBalance, balanceTotal, sweatBalance]);

  return {
    standing,
    hasLiveBalances,
    isLoading: hasLiveBalances && (isLoadingPresence || isLoadingSweat),
  };
};

export const RESIDENCY_TOKEN_SYMBOL =
  (blockchainConfig as Record<string, any>).BLOCKCHAIN_DAO_TOKEN?.symbol ||
  'TDF';
