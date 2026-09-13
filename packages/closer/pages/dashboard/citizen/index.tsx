import { useEffect } from 'react';

import { useRouter } from 'next/router';

const CitizenSingularRedirect = () => {
  const router = useRouter();

  const tab = router.query.tab;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof tab === 'string' && tab) {
      router.replace(`/dashboard/citizens/${tab}`);
      return;
    }
    router.replace('/dashboard/citizens/applications');
  }, [tab]);

  return null;
};

export default CitizenSingularRedirect;
