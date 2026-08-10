import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import type { Stay } from '../types/stay';
import {
  checkCarrotsAvailability,
  getCreditsBalance,
  getStayAccommodationTokenTotal,
  getStayTokenPricePerNight,
} from '../utils/stays.api';

export function useStayCreditsEligibility(stay: Stay | null | undefined) {
  const { user } = useAuth();
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [canApplyCreditsAtStart, setCanApplyCreditsAtStart] = useState(false);

  const stayStart = stay?.start;
  const tokenAccommodationVal = stay ? getStayAccommodationTokenTotal(stay) : 0;
  const tokenPricePerNight = stay ? getStayTokenPricePerNight(stay) : 0;
  const userId = user?._id;

  useEffect(() => {
    if (!userId || !stayStart || tokenPricePerNight <= 0) {
      setCreditsBalance(0);
      setCanApplyCreditsAtStart(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [balance, available] = await Promise.all([
          getCreditsBalance(),
          checkCarrotsAvailability({
            startDate: stayStart,
            creditsAmount: tokenAccommodationVal,
            minCreditsAmount: tokenPricePerNight,
          }),
        ]);
        if (!cancelled) {
          setCreditsBalance(balance);
          setCanApplyCreditsAtStart(available);
        }
      } catch {
        if (!cancelled) {
          setCreditsBalance(0);
          setCanApplyCreditsAtStart(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, stay?._id, stayStart, tokenAccommodationVal, tokenPricePerNight]);

  return { creditsBalance, canApplyCreditsAtStart };
}
