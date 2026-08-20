/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
/**
 * The Tailwind theme, read fresh from the config snapshot on every evaluation.
 *
 * `theme.js` gets the snapshot with `require`, which is correct there: that
 * module is reachable from the client bundle (AppHead imports the shared
 * tailwind config) so it has to be browser-safe, and webpack inlines the JSON
 * at build time anyway.
 *
 * A long-running dev server is the problem case. `require` memoises JSON for
 * the life of the process, so re-syncing the config would update the file on
 * disk while the server kept compiling the palette it booted with — you change
 * a colour, rebuild, and nothing moves.
 *
 * This exports a *function*, not a theme, and that is the whole point: module
 * exports are memoised too, so a module that reads the snapshot at load time
 * goes stale exactly like the JSON did. Calling it from `tailwind.config.js`
 * re-reads the file on every config evaluation, whatever Node has cached.
 *
 * Node-only: this is loaded by `apps/*\/tailwind.config.js`, never by app code.
 */
const fs = require('fs');
const path = require('path');

const { buildTheme, getThemingFromSnapshot } = require('./theming');

/**
 * The build always reads the snapshot the sync script writes. The override is
 * for tests, which need to mutate a snapshot — including to a half-written one —
 * without racing every other worker that imports the real file.
 */
const SNAPSHOT_PATH =
  process.env.CLOSER_CONFIG_SNAPSHOT ||
  path.join(__dirname, 'generated', 'appConfig.snapshot.json');

/**
 * A missing or half-written snapshot must not take the build down — the neutral
 * defaults are the right answer for "no config yet", which is the state a fresh
 * checkout is in before `build:config` has ever run.
 */
function readSnapshot() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/** Build the Tailwind theme from whatever the snapshot says right now. */
function buildThemeFromSnapshot(appFonts) {
  return buildTheme(getThemingFromSnapshot(readSnapshot()), appFonts);
}

module.exports = buildThemeFromSnapshot;
