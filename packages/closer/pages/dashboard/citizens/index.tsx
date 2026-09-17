import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { CITIZEN_FUNNEL_DEFAULT_TAB } from '../../../types/citizenFunnel';
import { citizenFunnelTabPath } from '../../../utils/citizenFunnel.helpers';

const CitizensFunnelIndexPage = () => {
  const router = useRouter();

  // `router` is a fresh object on every render, so depending on it re-fires
  // the replace on each pass. There is nothing to react to here — redirect once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    router.replace(citizenFunnelTabPath(CITIZEN_FUNNEL_DEFAULT_TAB));
  }, []);

  return null;
};

export default CitizensFunnelIndexPage;
