/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
/**
 * Branding lives in the `theming` config, edited in /dashboard/theming — not in
 * this file. This exports a *builder*, which tailwind.config.js calls: module
 * exports are memoised, so anything that resolved the theme at load time would
 * go stale in a running dev server and ignore a re-synced colour.
 *
 * Layout still injects --font-inter / --font-instrument-serif, so those ids fill
 * empty theming slots and `font-sans` keeps using those faces.
 *
 * Node-only: loaded by tailwind.config.js, never by app code.
 */
const buildThemeFromSnapshot = require('closer/theme.fresh');

module.exports = function buildAppTheme() {
  return buildThemeFromSnapshot({
    sans: 'inter',
    serif: 'instrument-serif',
  });
};
