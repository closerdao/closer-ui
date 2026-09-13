import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { Village } from '../types/village';
import { readApplicationAnswers } from '../utils/applicationAnswersStorage';
import { isSubscriptionActive } from '../utils/subscriptions.helpers';
import { fetchVillageCreatedBy } from '../utils/village.utils';
import {
  VillageFunnelFacts,
  isVillageFunnelEnabled,
} from '../utils/villageFunnel';

/**
 * Collects the four facts the self-checkout funnel is drawn from — application,
 * account, subscription, village — for the pages that only know some of them.
 *
 * `isInFunnel` is what decides whether the strip is shown at all: /signup and
 * /subscriptions are ordinary pages for everybody else, so they must not sprout
 * village steps for a visitor who never applied.
 *
 * The application answers are read in an effect rather than during render:
 * localStorage does not exist on the server, and reading it inline would make
 * the first client render disagree with the markup Next sent.
 */
export const useVillageFunnel = (): {
  facts: VillageFunnelFacts;
  village: Village | null;
  isEnabled: boolean;
  isInFunnel: boolean;
  isReady: boolean;
} => {
  const { user, isAuthenticated } = useAuth();
  const isEnabled = isVillageFunnelEnabled();
  const hasSubscription = isSubscriptionActive(user?.subscription);

  const [hasApplication, setHasApplication] = useState(false);
  const [village, setVillage] = useState<Village | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;
    setHasApplication(Boolean(readApplicationAnswers()));
    setIsReady(true);
  }, [isEnabled]);

  useEffect(() => {
    // Only a subscriber can have launched a village, so everybody else is
    // spared the lookup.
    if (!isEnabled || !user?._id || !hasSubscription) {
      setVillage(null);
      return;
    }
    let isCurrent = true;
    fetchVillageCreatedBy(user._id).then((found) => {
      if (isCurrent) setVillage(found);
    });
    return () => {
      isCurrent = false;
    };
  }, [isEnabled, user?._id, hasSubscription]);

  return {
    facts: { hasApplication, isAuthenticated, hasSubscription, village },
    village,
    isEnabled,
    isInFunnel: isEnabled && (hasApplication || Boolean(village)),
    isReady,
  };
};
