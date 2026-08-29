import { useEffect } from 'react';

import { useRouter } from 'next/router';

const CitizenSingularRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const tab = router.query.tab;
    if (typeof tab === 'string' && tab) {
      router.replace(`/dashboard/citizens/${tab}`);
      return;
    }
    router.replace('/dashboard/citizens/applications');
  }, [router]);

  return null;
};

export default CitizenSingularRedirect;
