import { useRouter } from 'next/router';

import { useEffect } from 'react';

import type { SettingsTabId } from '../../components/Settings/settingsTabs';

/**
 * Every settings section now has a route of its own. /settings keeps working
 * as the entry point, and legacy `#hash` links minted while the sections were
 * tabs are translated to their route.
 */
const LEGACY_HASH_ROUTES: Record<string, SettingsTabId> = {
  preferences: 'preferences',
  recommended: 'preferences',
  account: 'account',
  subscription: 'subscription',
  notifications: 'notifications',
  privacy: 'privacy',
};

const SettingsPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const [path, hash = ''] = router.asPath.split('#');
    // Bail out once the replace has landed, so this never bounces the router.
    if (path.replace(/\/$/, '') !== '/settings') return;
    const tab = LEGACY_HASH_ROUTES[hash] || 'preferences';
    void router.replace(`/settings/${tab}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.asPath]);

  return null;
};

export default SettingsPage;
