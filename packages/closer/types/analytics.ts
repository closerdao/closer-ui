import type { PostHog, Properties } from 'posthog-js';

/**
 * Fast refresh reloads posthog.ts (resetting its module-level `initialised`
 * flag) without resetting the posthog-js singleton itself — `__loaded` is an
 * undocumented internal flag the SDK sets once `init()` has run, used as a
 * fallback signal in that case.
 */
export type PostHogWithLoadedFlag = PostHog & { __loaded?: boolean };

/** The slice of the platform `general` config PostHog reads. */
export type PlatformConfig = {
  appName?: string;
  platformName?: string;
  semanticUrl?: string;
};

export type PendingIdentity = { userId: string; properties: Properties };
