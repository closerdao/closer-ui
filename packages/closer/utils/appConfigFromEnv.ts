/**
 * Env-derived config, spread last in each app's ConfigProvider so it wins over
 * the build-time config snapshot.
 *
 * APP_NAME is the feature discriminator and locale lookup key. There is no
 * usable fall-through for it: the only other source is the shared config
 * default (`general.appName`), which is `'tdf'`, so an app that omits
 * NEXT_PUBLIC_APP_NAME would silently identify as TDF and turn on TDF-only
 * branches (MemberMenu, Newsletter, Logo, Footer). Each app therefore passes
 * its own name as `fallbackAppName`; the env var still wins when set (villages
 * supply their slug at provisioning time).
 */
export function getAppConfigFromEnv(
  fallbackAppName?: string,
): Record<string, any> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || fallbackAppName;

  return {
    // Omit the key entirely when we have nothing, so a spread of this object
    // does not clobber an APP_NAME provided by the app's own config.
    ...(appName ? { APP_NAME: appName } : {}),
    // No fallback timezone (#990): omit the key when the env var is unset so a
    // spread of this object never invents a timezone or clobbers one supplied
    // by the app's own config.
    ...(process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE
      ? { DEFAULT_TIMEZONE: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE }
      : {}),
    STRIPE_CUSTOMER_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
  };
}
