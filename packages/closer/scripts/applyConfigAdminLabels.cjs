const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');
const configTs = path.join(__dirname, '..', 'config.ts');
const dataPath = path.join(
  __dirname,
  'data',
  'configAdminLabelTranslations.json',
);

function extractConfigKeys() {
  const t = fs.readFileSync(configTs, 'utf8');
  const top = new Set();
  for (const m of t.matchAll(/^      ([a-zA-Z][a-zA-Z0-9_]*): \{/gm)) {
    top.add(m[1]);
  }
  const inner = new Set();
  for (const m of t.matchAll(/^            ([a-zA-Z][a-zA-Z0-9_]*):/gm)) {
    inner.add(m[1]);
  }
  top.delete('enabled');
  return [...new Set([...top, ...inner])].sort();
}

const keys = extractConfigKeys();
const { en, pt } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const missingEn = keys.filter((k) => en[k] === undefined);
const missingPt = keys.filter((k) => pt[k] === undefined);
if (missingEn.length || missingPt.length) {
  console.error('Missing translations:', { missingEn, missingPt });
  process.exit(1);
}

function mergeLabels(file, overlay) {
  const p = path.join(localesDir, file);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const k of keys) {
    j[`config_label_${k}`] = overlay[k];
  }
  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
}

mergeLabels('base-en.json', en);
mergeLabels('base-pt.json', pt);
mergeLabels('base-pl.json', en);
