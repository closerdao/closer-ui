/**
 * Absolute base URL of the deployed site, without a trailing slash.
 *
 * Returns '' when NEXT_PUBLIC_PLATFORM_URL is not configured so that call
 * sites can omit canonical / og:url tags entirely instead of publishing an
 * absolute URL that points at another village's domain (closerdao/closer-ui#963).
 */
export const getSiteUrl = (): string =>
  (process.env.NEXT_PUBLIC_PLATFORM_URL || '').replace(/\/+$/, '');
