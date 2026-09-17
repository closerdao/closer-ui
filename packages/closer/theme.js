/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
/**
 * The Tailwind theme every app compiles against.
 *
 * There are no colour literals here. The palette is built from the `theming`
 * config an admin edits in /dashboard/theming, captured into
 * `generated/appConfig.snapshot.json` by `sync-build-config` at build time and
 * expanded by `buildTheme`. A platform that has configured nothing compiles the
 * neutral greyscale defaults in `theming.js` rather than any village's brand.
 *
 * This module is reachable from the client bundle (AppHead imports the shared
 * tailwind config), so it must stay browser-safe: no `fs`, no `path`. The
 * Node-only variant that re-reads the snapshot for Tailwind is `theme.fresh.js`.
 */
const { buildTheme, getThemingFromSnapshot } = require('./theming');
const configSnapshot = require('./generated/appConfig.snapshot.json');

module.exports = buildTheme(getThemingFromSnapshot(configSnapshot));
