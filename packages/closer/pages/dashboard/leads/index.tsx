import { useRouter } from 'next/router';

import { useEffect } from 'react';

import {
  LEAD_DEFAULT_PRESET,
  leadsTabPath,
} from '../../../utils/leads.helpers';

const LeadsDashboardIndexPage = () => {
  const router = useRouter();

  // `router` is a fresh object on every render, so depending on it re-fires
  // the replace on each pass. There is nothing to react to here — redirect once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    router.replace(leadsTabPath(LEAD_DEFAULT_PRESET));
  }, []);

  return null;
};

export default LeadsDashboardIndexPage;
