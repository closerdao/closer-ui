import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import api from '../utils/api';
import { hasConsumedFirstMonthFree } from '../utils/subscriptions.helpers';

export const useIntroOfferEligibility = () => {
  const { isAuthenticated, user } = useAuth();
  const consumedLocally = hasConsumedFirstMonthFree(user?.subscription);
  const [remoteEligible, setRemoteEligible] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setRemoteEligible(true);
      return;
    }
    if (consumedLocally) {
      setRemoteEligible(false);
      return;
    }

    let cancelled = false;
    setRemoteEligible(null);
    void (async () => {
      try {
        const response = await api.get('/subscription/intro-eligibility', {
          cache: false,
        } as any);
        if (!cancelled) {
          setRemoteEligible(Boolean(response.data?.results?.eligibleForIntro));
        }
      } catch {
        if (!cancelled) {
          setRemoteEligible(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, consumedLocally, user?._id]);

  const eligibleForIntro = !isAuthenticated
    ? true
    : consumedLocally
    ? false
    : Boolean(remoteEligible);

  return { eligibleForIntro };
};
