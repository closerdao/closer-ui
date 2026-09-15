const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * The dev-loop regression this guards.
 *
 * Saving a colour in /dashboard/theming writes it to the API; `build:config`
 * copies it into generated/appConfig.snapshot.json; Tailwind rebuilds and the
 * browser shows it. That chain broke twice in ways a unit test on `buildTheme`
 * could never catch, because both failures were about *memoisation*, not maths:
 *
 *   1. `require`ing the snapshot JSON memoised it for the process lifetime, so
 *      a dev server kept compiling the palette it booted with.
 *   2. Moving the read into a module did not help either — module exports are
 *      memoised too, so the module resolved the snapshot once and went stale.
 *
 * The fix is that each app's tailwind config calls a *builder function*, so the
 * file is read on every config evaluation.
 *
 * This runs in a real child process on purpose: jest keeps its own module
 * registry, so `require.cache` surgery inside a test would prove nothing about
 * the Node semantics that actually govern a Tailwind build.
 */
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const REAL_SNAPSHOT = path.join(
  __dirname,
  '..',
  'generated',
  'appConfig.snapshot.json',
);
/**
 * These cases rewrite the snapshot, and one of them writes a deliberately
 * broken file. Doing that to the real one breaks every other worker in the run:
 * `utils/buildTimeConfig.helpers.ts` imports it, so a suite that happens to load
 * while the file is garbage fails outright. Work on a copy instead, and point
 * the theme builder at it through CLOSER_CONFIG_SNAPSHOT.
 */
const SNAPSHOT = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'closer-snapshot-')),
  'appConfig.snapshot.json',
);
const APPS = [
  'closer',
  'earthbound',
  'lios',
  'moos',
  'per-auset',
  'tdf',
  'village-app',
];

const configPathFor = (app) =>
  path.join(REPO_ROOT, 'apps', app, 'tailwind.config.js');

const runNode = (source) =>
  JSON.parse(
    execFileSync(process.execPath, ['-e', source], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, CLOSER_CONFIG_SNAPSHOT: SNAPSHOT },
    }),
  );

/**
 * Change the snapshot, then reload the config dropping *only* the config from
 * the require cache — which is what Tailwind does when the config file changes.
 * Returns the accent produced after each change, in order.
 */
const accentsAfterSnapshotChanges = (app, colors) =>
  runNode(`
    const fs = require('fs');
    const SNAP = ${JSON.stringify(SNAPSHOT)};
    const CFG = require.resolve(${JSON.stringify(configPathFor(app))});
    const out = [];
    for (const hex of ${JSON.stringify(colors)}) {
      const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
      snap.theming = Object.assign({}, snap.theming, { primaryColor: hex });
      fs.writeFileSync(SNAP, JSON.stringify(snap) + '\\n');
      delete require.cache[CFG];
      out.push(require(CFG).theme.extend.colors.accent);
    }
    process.stdout.write(JSON.stringify(out));
  `);

describe('theme snapshot freshness', () => {
  let original;

  beforeAll(() => {
    original = fs.readFileSync(REAL_SNAPSHOT, 'utf8');
  });

  beforeEach(() => {
    fs.writeFileSync(SNAPSHOT, original);
  });

  it('every app exports a theme builder, not a resolved theme', () => {
    for (const app of APPS) {
      const mod = require(path.join(REPO_ROOT, 'apps', app, 'styles', 'theme.js'));
      expect(typeof mod).toBe('function');
    }
  });

  it('picks up a changed snapshot on every re-evaluation, not just the first', () => {
    expect(
      accentsAfterSnapshotChanges('tdf', ['#111111', '#0f9d58', '#ea349e']),
    ).toEqual(['#111111', '#0f9d58', '#ea349e']);
  });

  it('applies a change to every app, since they all compile one theme', () => {
    for (const app of APPS) {
      expect(accentsAfterSnapshotChanges(app, ['#abcdef'])).toEqual(['#abcdef']);
    }
  });

  it('falls back to neutral defaults when the snapshot is unreadable', () => {
    const { THEME_DEFAULTS } = require('../theming');
    fs.writeFileSync(SNAPSHOT, 'not json at all');
    const accent = runNode(
      `process.stdout.write(JSON.stringify(require(${JSON.stringify(
        configPathFor('tdf'),
      )}).theme.extend.colors.accent))`,
    );
    expect(accent).toBe(THEME_DEFAULTS.primaryColor);
  });

  it('lios still compiles Layout font variables when theming has no body font', () => {
    fs.writeFileSync(
      SNAPSHOT,
      JSON.stringify({ theming: { primaryColor: '#111111' } }),
    );
    const fonts = runNode(`
      process.stdout.write(JSON.stringify(require(${JSON.stringify(
        configPathFor('lios'),
      )}).theme.extend.fontFamily))
    `);
    expect(fonts.sans[0]).toContain('--font-cabinet');
    expect(fonts.accent[0]).toContain('--font-hoover');
    expect(fonts['accent-alt'][0]).toContain('--font-sincopa');
  });

  it('per-auset still compiles Layout font variables when theming has no body font', () => {
    fs.writeFileSync(
      SNAPSHOT,
      JSON.stringify({ theming: { primaryColor: '#111111' } }),
    );
    const fonts = runNode(`
      process.stdout.write(JSON.stringify(require(${JSON.stringify(
        configPathFor('per-auset'),
      )}).theme.extend.fontFamily))
    `);
    expect(fonts.sans[0]).toContain('--font-alegreya-sans');
  });

  it('closer still compiles Layout font variables when theming has no body font', () => {
    fs.writeFileSync(
      SNAPSHOT,
      JSON.stringify({ theming: { primaryColor: '#111111' } }),
    );
    const fonts = runNode(`
      process.stdout.write(JSON.stringify(require(${JSON.stringify(
        configPathFor('closer'),
      )}).theme.extend.fontFamily))
    `);
    expect(fonts.sans[0]).toContain('--font-inter');
    expect(fonts.serif[0]).toContain('--font-instrument-serif');
  });
});
