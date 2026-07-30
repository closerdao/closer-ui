import fs from 'fs';
import path from 'path';

/**
 * Station pickup is disabled platform-wide via the `pickUpEnabled` key on the
 * `booking` config slug. Every surface that *renders* pickup must read that
 * flag, or the feature silently reappears for users.
 *
 * This is a structural test rather than a render test on purpose. The gap this
 * guards against was not a logic error — it was `components/CurrentBooking.js`,
 * an untyped legacy file that no `*.tsx`-scoped search surfaced, rendering a
 * pickup column in production while the flag was off. A per-component render
 * test would only have covered the components we already knew about.
 */

const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['components', 'pages'];
const CODE_EXT = /\.(js|jsx|ts|tsx)$/;

/**
 * Files that reference `doesNeedPickup` without reading `pickUpEnabled`, for
 * reasons that are correct. Keep this list short and justified — adding to it
 * is how the bug this test exists to catch would come back.
 */
const ALLOWED = new Map([
  [
    'pages/bookings/create/accomodation.tsx',
    'Data-only: passes doesNeedPickup through the booking payload, renders no pickup UI.',
  ],
  [
    'components/SummaryDates.tsx',
    'Gated by contract: renders only when doesNeedPickup !== undefined, and every caller passes undefined when the flag is off.',
  ],
]);

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name === 'generated'
        ? []
        : walk(full);
    }
    return CODE_EXT.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name)
      ? [full]
      : [];
  });

describe('station pickup config gating', () => {
  const offenders: string[] = [];
  const allowedSeen = new Set<string>();

  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const source = fs.readFileSync(file, 'utf8');
      if (!source.includes('doesNeedPickup')) continue;

      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (ALLOWED.has(rel)) {
        allowedSeen.add(rel);
        continue;
      }
      if (!source.includes('pickUpEnabled')) offenders.push(rel);
    }
  }

  it('every component or page rendering pickup also reads pickUpEnabled', () => {
    expect(offenders).toEqual([]);
  });

  it('has no stale entries in the allowlist', () => {
    // If a file stops referencing pickup, its exemption should be deleted so the
    // list keeps meaning something.
    expect([...ALLOWED.keys()].filter((f) => !allowedSeen.has(f))).toEqual([]);
  });

  it('scans files regardless of extension, including legacy .js', () => {
    const scanned = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
    expect(scanned.some((f) => f.endsWith('.js'))).toBe(true);
  });
});
