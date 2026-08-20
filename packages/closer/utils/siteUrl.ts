/**
 * Absolute base URL of the deployed site, without a trailing slash and with
 * an https:// scheme prepended when the configured value has none.
 *
 * Returns '' when NEXT_PUBLIC_PLATFORM_URL is not configured so that call
 * sites can omit canonical / og:url tags entirely instead of publishing an
 * absolute URL that points at another village's domain (closerdao/closer-ui#963).
 */
export const getSiteUrl = (): string => {
  const raw = (process.env.NEXT_PUBLIC_PLATFORM_URL || '').replace(/\/+$/, '');
  if (!raw) return '';
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
};
