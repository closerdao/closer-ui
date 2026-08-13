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
/**
 * Single resolution chain for the app's display timezone: the village's own
 * config first, then the deployment env. Shared code carries no timezone
 * default (#990); a branded app passes its own last-resort literal once here,
 * and village-app passes none — its build requires the env var instead.
 */
export function resolveTimeZone(
  config: { TIME_ZONE?: string } | null | undefined,
  appFallbackTimeZone: string,
): string;
export function resolveTimeZone(
  config: { TIME_ZONE?: string } | null | undefined,
): string | undefined;
export function resolveTimeZone(
  config: { TIME_ZONE?: string } | null | undefined,
  appFallbackTimeZone?: string,
): string | undefined {
  return (
    config?.TIME_ZONE ||
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ||
    appFallbackTimeZone ||
    undefined
  );
}

export function getAppConfigFromEnv(
  fallbackAppName?: string,
): Record<string, any> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || fallbackAppName;
  const timezone = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;

  return {
    // Omit the key entirely when we have nothing, so a spread of this object
    // does not clobber an APP_NAME provided by the app's own config.
    ...(appName ? { APP_NAME: appName } : {}),
    // No fallback timezone (#990): omit the key when the env var is unset so a
    // spread of this object never invents a timezone or clobbers one supplied
    // by the app's own config.
    ...(timezone ? { DEFAULT_TIMEZONE: timezone } : {}),
    STRIPE_CUSTOMER_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
  };
}
