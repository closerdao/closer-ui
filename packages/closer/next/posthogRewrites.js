/**
 * Same-origin proxy for PostHog so ad blockers don't drop `*.posthog.com`.
 * Use in next.config.js:
 *
 *   const { posthogRewrites } = require('closer/next/posthogRewrites');
 *   module.exports = { async rewrites() { return posthogRewrites(); }, skipTrailingSlashRedirect: true, ... }
 *
 * `skipTrailingSlashRedirect` is required by PostHog for the proxy to work.
 */
const DEFAULT_HOST = 'https://eu.i.posthog.com';
const DEFAULT_ASSETS_HOST = 'https://eu-assets.i.posthog.com';

function posthogRewrites(options = {}) {
  const basePath = options.basePath || '/ingest';
  const host =
    options.host || process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_HOST;
  const derivedAssetsHost = host.replace(/\/\/(\w+)\.i\./, '//$1-assets.i.');
  // replace() returns the input unchanged on no match — that would 404 the
  // replay recorder script, so fall back to the EU assets host instead.
  const assetsHost =
    options.assetsHost ||
    (derivedAssetsHost !== host ? derivedAssetsHost : DEFAULT_ASSETS_HOST);
  return [
    {
      source: `${basePath}/static/:path*`,
      destination: `${assetsHost}/static/:path*`,
    },
    { source: `${basePath}/:path*`, destination: `${host}/:path*` },
  ];
}

module.exports = { posthogRewrites };
