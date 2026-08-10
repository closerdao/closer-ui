import { useRouter } from 'next/router';

import { useEffect } from 'react';

/**
 * Membership management is a tab on /settings. This route stays as a
 * redirect so links that were minted while it was its own page keep working.
 */
const SubscriptionSettingsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings#subscription');
  }, []);

  return null;
};

export default SubscriptionSettingsPage;
