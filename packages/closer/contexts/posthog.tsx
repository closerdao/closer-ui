import { FC, PropsWithChildren, useEffect, useRef } from 'react';

import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react';

import { identifyUser, initPostHog, posthog, resetUser } from '../utils/posthog';
import { useAuth } from './auth';

export const PostHogProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const lastIdentified = useRef<string | null>(null);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const id = user?._id ? String(user._id) : null;
    const roles = user?.roles ?? [];
    const identity = id ? `${id}|${[...roles].sort().join(',')}` : null;
    if (identity && identity !== lastIdentified.current) {
      identifyUser(id as string, { roles });
      lastIdentified.current = identity;
    } else if (!identity) {
      resetUser();
      lastIdentified.current = null;
    }
  }, [isLoading, user?._id, user?.roles]);

  return (
    <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
  );
};
