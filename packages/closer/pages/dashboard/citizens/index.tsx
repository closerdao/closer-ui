import { useEffect } from 'react';

import { useRouter } from 'next/router';

import { CITIZEN_FUNNEL_DEFAULT_TAB } from '../../../types/citizenFunnel';
import { citizenFunnelTabPath } from '../../../utils/citizenFunnel.helpers';

const CitizensFunnelIndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(citizenFunnelTabPath(CITIZEN_FUNNEL_DEFAULT_TAB));
  }, [router]);

  return null;
};

export default CitizensFunnelIndexPage;
