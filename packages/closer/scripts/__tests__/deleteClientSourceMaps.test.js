/**
 * @jest-environment node
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'deleteClientSourceMaps.cjs');

let appDir;

const write = (relativePath) => {
  const filePath = path.join(appDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '');
};

const exists = (relativePath) => fs.existsSync(path.join(appDir, relativePath));

const run = () =>
  execFileSync(process.execPath, [SCRIPT], { cwd: appDir, stdio: 'pipe' });

beforeEach(() => {
  appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'delete-source-maps-'));
});

afterEach(() => {
  fs.rmSync(appDir, { recursive: true, force: true });
});

it('removes every map under .next/static and keeps the bundles', () => {
  write('.next/static/chunks/main.js');
  write('.next/static/chunks/main.js.map');
  write('.next/static/chunks/pages/_app.js.map');
  write('.next/static/css/app.css.map');

  run();

  expect(exists('.next/static/chunks/main.js')).toBe(true);
  expect(exists('.next/static/chunks/main.js.map')).toBe(false);
  expect(exists('.next/static/chunks/pages/_app.js.map')).toBe(false);
  expect(exists('.next/static/css/app.css.map')).toBe(false);
});

it('leaves maps outside the public static output alone', () => {
  write('.next/server/chunks/api.js.map');

  run();

  expect(exists('.next/server/chunks/api.js.map')).toBe(true);
});

it('does nothing when the app has not been built', () => {
  expect(() => run()).not.toThrow();
});
