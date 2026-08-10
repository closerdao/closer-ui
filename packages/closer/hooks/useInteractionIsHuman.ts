import { useEffect, useState } from 'react';

import { INTERACTION_IS_HUMAN_EVENT } from '../constants';
import { getStoredInteractionIsHuman } from '../utils/interactionSession';

export function useInteractionIsHuman(): boolean {
  const [isHuman, setIsHuman] = useState(false);

  useEffect(() => {
    setIsHuman(getStoredInteractionIsHuman());
    const onVerified = () => setIsHuman(true);
    window.addEventListener(INTERACTION_IS_HUMAN_EVENT, onVerified);
    return () => window.removeEventListener(INTERACTION_IS_HUMAN_EVENT, onVerified);
  }, []);

  return isHuman;
}
