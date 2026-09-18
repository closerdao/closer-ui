#!/usr/bin/env node
/**
 * Postbuild safety net: removes every source map from the app's public
 * `.next/static` output. `withCloserPostHogConfig` already deletes maps after uploading them
 * to PostHog, but if the upload fails the plugin logs the error and leaves the
 * maps on disk, where Vercel would serve them from `/_next/static`. Builds
 * without the PostHog keys emit no browser maps, so this is a no-op there.
 */
const fs = require('fs');
const path = require('path');

const staticDir = path.resolve(process.cwd(), '.next', 'static');

function deleteMaps(dir) {
  let deleted = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      deleted += deleteMaps(entryPath);
    } else if (entry.name.endsWith('.map')) {
      fs.rmSync(entryPath);
      deleted += 1;
    }
  }
  return deleted;
}

if (fs.existsSync(staticDir)) {
  const deleted = deleteMaps(staticDir);
  if (deleted > 0) {
    console.warn(
      `[delete-client-source-maps] removed ${deleted} leftover .map file(s) from ${staticDir}`,
    );
  }
}
