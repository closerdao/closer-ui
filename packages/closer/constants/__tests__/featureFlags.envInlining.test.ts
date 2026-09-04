/**
 * Env-gated config groups vanished from the admin config screen even though
 * Vercel had `NEXT_PUBLIC_FEATURE_BOOKING=true` and friends set.
 *
 * The cause was a computed read — `process.env[name]`. Next.js substitutes
 * `NEXT_PUBLIC_*` vars with webpack's DefinePlugin, which only rewrites literal
 * member expressions; a computed read survives into the bundle, where
 * `process` is a polyfill with `env = {}`. Every flag came back `undefined` in
 * the browser and every gated group fell into "Additional features".
 *
 * The behaviour tests below pass either way (Jest runs in Node, where
 * `process.env` is real), so the source-shape assertion is the part that
 * actually guards the bug.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  getEffectiveAllowedConfigs,
  isConfigUnlockedByEnv,
} from '../featureFlags';

const FLAG_KEYS = [
  'NEXT_PUBLIC_FEATURE_BOOKING',
  'NEXT_PUBLIC_FEATURE_VOLUNTEERING',
  'NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS',
  'NEXT_PUBLIC_FEATURE_SUPPORT_US',
  'NEXT_PUBLIC_FEATURE_COURSES',
  'NEXT_PUBLIC_FEATURE_CITIZENSHIP',
  'NEXT_PUBLIC_FEATURE_AFFILIATE',
  'NEXT_PUBLIC_FEATURE_BLOG',
  'NEXT_PUBLIC_FEATURE_ROLES',
  'NEXT_PUBLIC_FEATURE_RESIDENCY',
  'NEXT_PUBLIC_FEATURE_REFERRAL',
  'NEXT_PUBLIC_FEATURE_CARROTS',
  'NEXT_PUBLIC_FEATURE_WEB3_WALLET',
  'NEXT_PUBLIC_FEATURE_WEB3_BOOKING',
];

const source = readFileSync(join(__dirname, '..', 'featureFlags.ts'), 'utf8');

/**
 * Comments in that file quote the broken `process.env[name]` shape on purpose,
 * so the shape assertions have to look at code only.
 */
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

describe('featureFlags — env reads survive bundling', () => {
  it('never reads process.env with a computed key', () => {
    expect(code).not.toMatch(/process\.env\s*\[/);
  });

  it('reads every gating flag as a literal process.env.<NAME>', () => {
    FLAG_KEYS.forEach((key) => {
      expect(code).toContain(`process.env.${key}`);
    });
  });

  it('covers every flag named in FEATURE_FLAG_BY_CONFIG', () => {
    const source_flags = Array.from(
      code.matchAll(/'(NEXT_PUBLIC_FEATURE_[A-Z0-9_]+)'/g),
      (match) => match[1],
    );
    source_flags.forEach((flag) => {
      expect(FLAG_KEYS).toContain(flag);
    });
  });
});

describe('featureFlags — gating behaviour', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    FLAG_KEYS.forEach((key) => {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    });
  });

  it('unlocks the booking family when the booking flag is on', () => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    const allowed = getEffectiveAllowedConfigs();
    expect(allowed).toEqual(
      expect.arrayContaining(['booking', 'booking-rules', 'payment']),
    );
    expect(isConfigUnlockedByEnv('booking')).toBe(true);
  });

  it('keeps a gated group locked when its flag is off', () => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'false';
    expect(getEffectiveAllowedConfigs()).not.toContain('booking');
    expect(isConfigUnlockedByEnv('booking')).toBe(false);
  });

  it('unlocks the credit group when the carrots flag is on', () => {
    // `credit` was mapped to this flag but the flag was never read, so the
    // group sat in "Additional features" no matter what the env said.
    process.env.NEXT_PUBLIC_FEATURE_CARROTS = 'true';
    expect(getEffectiveAllowedConfigs()).toContain('credit');
    expect(isConfigUnlockedByEnv('credit')).toBe(true);
  });

  it('leaves ungated groups unlocked', () => {
    expect(isConfigUnlockedByEnv('events')).toBe(true);
    expect(getEffectiveAllowedConfigs()).toContain('general');
  });
});
