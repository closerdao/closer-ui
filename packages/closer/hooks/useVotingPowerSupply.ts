import { useEffect, useState } from 'react';

import api from '../utils/api';
import {
  EMPTY_VOTING_POWER_SUPPLY,
  VotingPowerSupply,
  WALLET_SUMS_PATH,
  buildVotingPower,
  parseWalletSums,
} from '../utils/votingPower.helpers';

const CACHE_TTL = 60000;

let cache: { result: VotingPowerSupply; timestamp: number } | null = null;
let inFlight: Promise<VotingPowerSupply> | null = null;

const fetchWalletTotals = async (): Promise<VotingPowerSupply> => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.result;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const res = await api.get(WALLET_SUMS_PATH);
    const result = parseWalletSums(res?.data);

    cache = { result, timestamp: Date.now() };

    return result;
  })();

  try {
    return await inFlight;
  } catch (err) {
    console.error('Error reading platform voting power:', err);
    return EMPTY_VOTING_POWER_SUPPLY;
  } finally {
    inFlight = null;
  }
};

/**
 * Platform-wide voting power: every member's token balance as the API last
 * snapshotted it in `user.stats.wallet`, summed by `/sum/user/wallet`.
 *
 * Deliberately not read from the chain. A proposal's quorum is a share of the
 * voting power the API had recorded when voting opened, so a total summed off
 * live `totalSupply()` calls would be measured against a different population
 * than the one the quorum was cut from.
 */
export const useVotingPowerSupply = () => {
  const [supply, setSupply] = useState<VotingPowerSupply>(
    EMPTY_VOTING_POWER_SUPPLY,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isStale = false;

    fetchWalletTotals()
      .then((result) => {
        if (!isStale) {
          setSupply(result);
        }
      })
      // The card is allowed to be absent; it is not allowed to take the page
      // down with an unhandled rejection.
      .catch((err) => {
        console.error('Error reading platform voting power:', err);
      })
      .finally(() => {
        if (!isStale) {
          setIsLoading(false);
        }
      });

    return () => {
      isStale = true;
    };
  }, []);

  return {
    ...supply,
    ...buildVotingPower(supply),
    isLoading,
  };
};
