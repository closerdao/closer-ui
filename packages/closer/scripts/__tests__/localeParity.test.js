const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { SNAPSHOT_PATH, readJson } = require('../localeConstants.cjs');
const {
  mergeMessages,
  readVillageLocalesOverlay,
} = require('../syncBuildLocales.cjs');

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'locales');
const GENERATED_ROOT = path.join(__dirname, '..', '..', 'generated', 'locales');

// generated/locales/ is gitignored and produced by the prebuild step, so
// regenerate it here rather than depending on task ordering.
execFileSync(
  process.execPath,
  [path.join(__dirname, '..', 'syncBuildLocales.cjs')],
  { stdio: 'ignore' },
);

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
    const villageOverlay = readVillageLocalesOverlay(readJson(SNAPSHOT_PATH), {
      warn: () => {},
    });
    for (const app of generatedApps) {
      const expected = mergeMessages(app, 'en', villageOverlay);
      const actual = readJson(path.join(GENERATED_ROOT, app, 'en.json'));
      expect({ app, messages: actual }).toEqual({ app, messages: expected });
    }
  });
});
