import type { PostHog } from 'posthog-js';

/**
 * Fast refresh reloads posthog.ts (resetting its module-level `initialised`
 * flag) without resetting the posthog-js singleton itself — `__loaded` is an
 * undocumented internal flag the SDK sets once `init()` has run, used as a
 * fallback signal in that case.
 */
export type PostHogWithLoadedFlag = PostHog & { __loaded?: boolean };
