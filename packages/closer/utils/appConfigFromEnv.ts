export function getAppConfigFromEnv(): Record<string, any> {
  // NEXT_PUBLIC_APP_NAME is required (no default): deployments supply it
  // explicitly (for villages, provisioning supplies the village slug). When it
  // is unset we omit the key entirely so a spread of this object does not
  // clobber an APP_NAME provided by the app's own config.
  return {
    ...(process.env.NEXT_PUBLIC_APP_NAME
      ? { APP_NAME: process.env.NEXT_PUBLIC_APP_NAME }
      : {}),
    DEFAULT_TIMEZONE:
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Europe/Lisbon',
    STRIPE_CUSTOMER_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
  };
}
