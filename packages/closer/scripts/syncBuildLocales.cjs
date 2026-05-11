require('./ensureBuildLocalesExist.cjs');

const fs = require('fs');
const path = require('path');

const LOCALES_ROOT = path.join(__dirname, '..', 'locales');
const OUT_ROOT = path.join(__dirname, '..', 'generated', 'locales');

const APP_LOCALES = {
  lios: ['en', 'pl'],
  tdf: ['en', 'pt'],
  moos: ['en', 'pt'],
  foz: ['en'],
  'per-auset': ['en'],
  earthbound: ['en'],
  closer: ['en'],
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[sync-build-locales] Invalid JSON: ${filePath}`);
    throw e;
  }
}

function mergeMessages(app, locale) {
  const basePath = path.join(LOCALES_ROOT, `base-${locale}.json`);
  const appPath = path.join(LOCALES_ROOT, app, `${locale}.json`);
  const base = readJson(basePath);
  const appMessages = readJson(appPath);
  return { ...base, ...appMessages };
}

function main() {
  for (const [app, locales] of Object.entries(APP_LOCALES)) {
    const appDir = path.join(OUT_ROOT, app);
    fs.mkdirSync(appDir, { recursive: true });
    for (const locale of locales) {
      const merged = mergeMessages(app, locale);
      const outPath = path.join(appDir, `${locale}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(merged)}\n`, 'utf8');
      console.log('[sync-build-locales] wrote', outPath);
    }
  }
}

main();
