import { useContext, useEffect, useMemo, useState } from 'react';

import { blockchainConfig } from '../config_blockchain';
import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { ResidencyParams, ResidencyStanding } from '../types/residency';
import { getCurrentUnitPrice } from '../utils/bondingCurve';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { parseResidencyConfig } from '../utils/residency.helpers';
import { useBuyTokens } from './useBuyTokens';
import { usePresenceToken } from './usePresenceToken';
import { useSweatToken } from './useSweatToken';

const FALLBACK_TOKEN_PRICE = 259.44;

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The parameters half of the residency tool: the DAO-editable `residency`
 * config plus the $TDF price read off the bonding curve at the live supply.
 *
 * The price is deliberately not a config field — quoting a stale hand-typed
 * price would let the settlement drift from what the token actually costs.
 */
export const useResidencyParams = (): {
  params: ResidencyParams;
  isEnabled: boolean;
  isLoading: boolean;
} => {
  const config = getCachedConfig('residency');
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

  const params = useMemo(
    () =>
      parseResidencyConfig(
        config,
        tokenPrice ?? FALLBACK_TOKEN_PRICE,
        tokenPrice !== null,
      ),
    [config, tokenPrice],
  );

  return {
    params,
    isEnabled: Boolean(config?.enabled),
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
