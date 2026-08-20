/**
 * Locale parity guard.
 *
 * Every generated English bundle must contain every key that the Closer bundle
 * contains. Apps are free to ADD keys in their own overlay, but a key that only
 * exists in one overlay is invisible to every other app — next-intl silently
 * renders the raw key path when a message is missing, so the regression is only
 * caught by eyeballing a live page.
 *
 * The village bundle is pure base (no overlay directory on purpose), so this
 * effectively asserts that every shared key lives in locales/base-en.json.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'locales');
const GENERATED_ROOT = path.join(__dirname, '..', '..', 'generated', 'locales');

// generated/locales/ is gitignored and produced by the prebuild step, so
// regenerate it here rather than depending on task ordering.
execFileSync(
  process.execPath,
  [path.join(__dirname, '..', 'syncBuildLocales.cjs')],
  { stdio: 'ignore' },
);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const generatedApps = fs
  .readdirSync(GENERATED_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((app) => fs.existsSync(path.join(GENERATED_ROOT, app, 'en.json')));

const closerKeys = Object.keys(
  readJson(path.join(GENERATED_ROOT, 'closer', 'en.json')),
);

describe('generated locale bundles', () => {
  it('finds generated English bundles to check', () => {
    expect(generatedApps).toContain('closer');
    expect(generatedApps).toContain('village');
    expect(closerKeys.length).toBeGreaterThan(0);
  });

  it.each(generatedApps)(
    '%s/en.json contains every key the closer bundle has',
    (app) => {
      const messages = readJson(path.join(GENERATED_ROOT, app, 'en.json'));
      const missing = closerKeys.filter((key) => !(key in messages));
      expect({ app, missing }).toEqual({ app, missing: [] });
    },
  );

  it('locales/base-en.json defines every shared key (overlays only override)', () => {
    const base = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    const missing = closerKeys.filter((key) => !(key in base));
    expect(missing).toEqual([]);
  });

  it('generated bundles are in sync with locales/ (run pnpm build:locales)', () => {
    const base = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    for (const app of generatedApps) {
      const overlayPath = path.join(LOCALES_ROOT, app, 'en.json');
      const overlay = fs.existsSync(overlayPath) ? readJson(overlayPath) : {};
      const expected = { ...base, ...overlay };
      const actual = readJson(path.join(GENERATED_ROOT, app, 'en.json'));
      expect({ app, messages: actual }).toEqual({ app, messages: expected });
    }
  });
});
