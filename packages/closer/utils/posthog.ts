import posthog from 'posthog-js';
import type { PostHogConfig, Properties } from 'posthog-js';

/**
 * Single shared PostHog project for every Closer app (custom villages and the
 * generic village-app). Per-village splitting is done with the `app`
 * super-property, not separate projects.
 *
 * The `phc_` project API key is public by design (it can only send events and
 * evaluate flags), so it is safe to hardcode as a default here. Per
 * deployment, `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` override.
 */
export const DEFAULT_POSTHOG_KEY =
  'phc_sUZtotVwTqzq5YjsYcF6XQCpNLofosijB6bjnLoK7LDX';
export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';
export const POSTHOG_UI_HOST = 'https://eu.posthog.com';
/** Same-origin path proxied to PostHog by `posthogRewrites()` (dodges ad blockers). */
export const POSTHOG_INGEST_PATH = '/ingest';

export const COOKIE_CONSENT_KEY = 'CookieConsent';
/** Elements carrying this attribute are masked in session replays. */
export const POSTHOG_MASK_ATTR = 'data-ph-mask';
export const POSTHOG_MASK_SELECTOR = `[${POSTHOG_MASK_ATTR}]`;

export const getPostHogKey = (): string =>
  process.env.NEXT_PUBLIC_POSTHOG_KEY || DEFAULT_POSTHOG_KEY;

export const getPostHogHost = (): string =>
  process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_POSTHOG_HOST;

/**
 * Off unless a deployment opts in with NEXT_PUBLIC_POSTHOG_ENABLED=true.
 * Keeps localhost, previews and smoke tests out of the shared project.
 */
export const isPostHogEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED === 'true' && !!getPostHogKey();

export const hasCookieConsent = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((c) => c.trim() === `${COOKIE_CONSENT_KEY}=true`);
};

export const getAppName = (): string | undefined =>
  process.env.NEXT_PUBLIC_APP_NAME || undefined;

let initialised = false;
let pendingIdentity: { userId: string; properties: Properties } | null = null;

export const buildPostHogConfig = (
  overrides: Partial<PostHogConfig> = {},
): Partial<PostHogConfig> => ({
  // Proxied via next.config rewrites; see posthogRewrites().
  api_host: POSTHOG_INGEST_PATH,
  ui_host: POSTHOG_UI_HOST,
  // Opt into current recommended defaults: history_change pageviews,
  // pageleave, strict minimum replay duration, etc.
  defaults: '2026-05-30',
  person_profiles: 'identified_only',
  persistence: 'localStorage+cookie',
  opt_out_capturing_by_default: true,
  autocapture: true,
  rageclick: true,
  capture_dead_clicks: true,
  capture_heatmaps: true,
  capture_performance: { web_vitals: true },
  capture_exceptions: true,
  enable_recording_console_log: false,
  mask_personal_data_properties: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: POSTHOG_MASK_SELECTOR,
    blockSelector: POSTHOG_MASK_SELECTOR,
    recordCrossOriginIframes: false,
  },
  ...overrides,
});

/**
 * Idempotent. No-op on the server, when disabled, or when already loaded.
 * Returns true if PostHog is live after the call.
 */
export const initPostHog = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!isPostHogEnabled() || !hasCookieConsent()) return false;
  // Fast refresh reloads this module (resetting `initialised`) without
  // resetting the posthog-js singleton — trust the SDK's own flag too.
  if (initialised || (posthog as { __loaded?: boolean }).__loaded) {
    initialised = true;
    return true;
  }
  posthog.init(getPostHogKey(), {
    ...buildPostHogConfig(),
    loaded: (ph) => {
      const appName = getAppName();
      if (appName) ph.register({ app: appName });
      ph.opt_in_capturing();
      if (pendingIdentity) {
        ph.identify(pendingIdentity.userId, pendingIdentity.properties);
      }
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') ph.debug();
    },
  });
  initialised = true;
  return true;
};

/** Called once the visitor accepts cookies: keep identity across sessions. */
export const applyConsentPersistence = (): void => {
  if (!hasCookieConsent()) return;
  if (!initialised && !initPostHog()) return;
  posthog.set_config({ persistence: 'localStorage+cookie' });
  posthog.opt_in_capturing();
};

export const identifyUser = (
  userId: string,
  properties: Properties = {},
): void => {
  pendingIdentity = {
    userId,
    properties: { ...properties, app: getAppName() },
  };
  if (!initialised || !hasCookieConsent()) return;
  posthog.identify(pendingIdentity.userId, pendingIdentity.properties);
};

export const resetUser = (): void => {
  pendingIdentity = null;
  if (!initialised) return;
  posthog.reset();
  const appName = getAppName();
  if (appName) posthog.register({ app: appName });
};

/** Custom event capture; safe to call anywhere, no-op when disabled. */
export const trackEvent = (event: string, properties?: Properties): void => {
  if (!initialised || !hasCookieConsent()) return;
  posthog.capture(event, properties);
};

/**
 * Canonical growth events — keep this list short. Note: the same user actions
 * also reach PostHog under their legacy platform-metric names via the
 * logMetric mirror (e.g. `booking_created` and `booking-summary-complete-success`
 * both fire) — build funnels on the canonical names only.
 */
export const AnalyticsEvents = {
  USER_SIGNED_UP: 'user_signed_up',
  BOOKING_CREATED: 'booking_created',
  SUBSCRIPTION_STARTED: 'subscription_started',
  TOKEN_PURCHASED: 'token_purchased',
} as const;

/** Test-only: forget that init ran. */
export const __resetPostHogForTests = (): void => {
  initialised = false;
  pendingIdentity = null;
};

export { posthog };
