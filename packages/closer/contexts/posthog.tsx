import { FC, PropsWithChildren, useEffect, useRef } from 'react';

import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react';

import {
  AnalyticsEvents,
  identifyUser,
  initPostHog,
  posthog,
  resetUser,
  trackEvent,
} from '../utils/posthog';
import { useAuth } from './auth';

/**
 * Mount once per app, inside <AuthProvider>. Initialises the shared
 * posthog-js singleton (when NEXT_PUBLIC_POSTHOG_ENABLED=true), exposes the
 * React flag hooks, and keeps the PostHog identity in sync with auth.
 */
export const PostHogProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const lastIdentified = useRef<string | null>(null);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const id = user?._id ? String(user._id) : null;
    const roles = user?.roles ?? [];
    // Include roles so a mid-session role change re-identifies with fresh data.
    const identity = id ? `${id}|${[...roles].sort().join(',')}` : null;
    if (identity && identity !== lastIdentified.current) {
      identifyUser(id as string, { roles });
      lastIdentified.current = identity;
    } else if (!identity && lastIdentified.current) {
      resetUser();
      lastIdentified.current = null;
    }
  }, [user?._id, user?.roles]);

  return (
    <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
  );
};

export const useAnalytics = () => ({
  track: trackEvent,
  events: AnalyticsEvents,
  posthog,
});
