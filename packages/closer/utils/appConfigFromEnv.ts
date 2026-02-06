export function getAppConfigFromEnv(): Record<string, any> {
  return {
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'closer',
    DEFAULT_TIMEZONE:
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Europe/Lisbon',
    LOGO_HEADER: process.env.NEXT_PUBLIC_LOGO_HEADER || '/images/logo.png',
    STRIPE_CUSTOMER_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
  };
}
