/**
 * Guard for the village-app t3-env runtime map.
 *
 * @t3-oss/env-core re-validates the client schema in the browser, so it needs
 * the real values there. Next.js only string-replaces member expressions
 * (`process.env.NEXT_PUBLIC_FOO`); a bare `process.env` is left alone and
 * resolves to webpack's `{}` polyfill client-side. Passing
 * `experimental__runtimeEnv: process.env` therefore validates an empty object
 * in the browser — every NEXT_PUBLIC_* read comes back undefined, and a
 * required key throws at module load so the app never hydrates.
 *
 * Every key in villageAppEnvShape must appear in experimental__runtimeEnv as an
 * explicit `KEY: process.env.KEY` pair.
 */
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'apps',
  'village-app',
  'env.js',
);

const source = fs.readFileSync(ENV_FILE, 'utf8');

const sliceBlock = (startMarker) => {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`marker not found: ${startMarker}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced block for ${startMarker}`);
};

const keysIn = (block) =>
  Array.from(block.matchAll(/^\s{2,4}(NEXT_PUBLIC_[A-Z0-9_]+):/gm)).map(
    (m) => m[1],
  );

describe('apps/village-app/env.js', () => {
  const shapeKeys = keysIn(sliceBlock('export const villageAppEnvShape'));
  const runtimeBlock = sliceBlock('experimental__runtimeEnv');
  const runtimeKeys = keysIn(runtimeBlock);

  it('reads a non-empty schema shape', () => {
    expect(shapeKeys.length).toBeGreaterThan(10);
  });

  it('does not hand t3-env a bare process.env', () => {
    expect(source).not.toMatch(/experimental__runtimeEnv:\s*process\.env\b/);
  });

  it('lists every schema key in experimental__runtimeEnv', () => {
    const missing = shapeKeys.filter((key) => !runtimeKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it('defaults every feature gate to off (#950)', () => {
    const shapeBlock = sliceBlock('export const villageAppEnvShape');
    const featureLines = shapeBlock
      .split('\n')
      .filter((line) => /NEXT_PUBLIC_FEATURE_[A-Z0-9_]+:/.test(line));
    expect(featureLines.length).toBeGreaterThan(10);
    const defaultingOn = featureLines.filter(
      (line) => !line.includes(".default('false')"),
    );
    expect(defaultingOn).toEqual([]);
  });

  it('requires a timezone with no fallback (#990)', () => {
    const shapeBlock = sliceBlock('export const villageAppEnvShape');
    const tzLine = shapeBlock
      .split(/,\n(?=\s{2}NEXT_PUBLIC_)/)
      .find((entry) => entry.includes('NEXT_PUBLIC_DEFAULT_TIMEZONE'));
    expect(tzLine).toBeDefined();
    expect(tzLine).not.toMatch(/\.optional\(\)|\.default\(/);
    expect(source).not.toMatch(/Europe\/Lisbon/);
    const requiredBlock = source.slice(
      source.indexOf('export const requiredProvisioningEnvKeys'),
      source.indexOf('export const optionalProvisioningEnvKeys'),
    );
    expect(requiredBlock).toContain('NEXT_PUBLIC_DEFAULT_TIMEZONE');
  });

  it('maps each key to its own inlinable process.env member expression', () => {
    const wrong = runtimeKeys.filter(
      (key) =>
        !new RegExp(`${key}:\\s*\\n?\\s*process\\.env\\.${key}\\s*,`).test(
          runtimeBlock,
        ),
    );
    expect(wrong).toEqual([]);
  });
});
