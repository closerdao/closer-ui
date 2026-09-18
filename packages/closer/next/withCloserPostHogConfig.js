/**
 * Uploads browser source maps to PostHog Error Tracking during `next build`,
 * so captured exceptions resolve to the original file, function and line.
 * Use as the outermost wrapper in next.config.js:
 *
 *   const { withCloserPostHogConfig } = require('closer/next/withCloserPostHogConfig');
 *   module.exports = withCloserPostHogConfig(withMDX(nextConfig));
 *
 * Runs only for production builds with `POSTHOG_API_KEY` (scopes:
 * Error Tracking write, Organization read) and `POSTHOG_PROJECT_ID` set;
 * otherwise the config passes through untouched, so local builds and CI need
 * no secrets.
 *
 * Maps are deleted after upload so they are never served publicly.
 * `scripts/deleteClientSourceMaps.cjs` runs as `postbuild` to catch any left
 * behind when the upload itself fails.
 */
const { withPostHogConfig } = require('@posthog/nextjs-config');
const path = require('path');

const { posthogHost } = require('./posthogRewrites');

function withCloserPostHogConfig(nextConfig) {
  const personalApiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!personalApiKey || !projectId || process.env.NODE_ENV !== 'production') {
    return nextConfig;
  }

  return withPostHogConfig(nextConfig, {
    personalApiKey,
    projectId,
    host: posthogHost(),
    sourcemaps: {
      enabled: true,
      releaseName:
        process.env.NEXT_PUBLIC_APP_NAME || path.basename(process.cwd()),
      // Vercel builds have no .git, so the CLI can't derive the commit itself.
      releaseVersion: process.env.VERCEL_GIT_COMMIT_SHA,
      deleteAfterUpload: true,
    },
  });
}

module.exports = { withCloserPostHogConfig };
