const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx']);

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'out',
  'coverage',
  '.turbo',
  'cypress',
  'generated',
]);

const EXTRACTION_RES = [
  /\bt\(\s*['"]([^'"]+)['"]/g,
  /\bt\.rich\(\s*['"]([^'"]+)['"]/g,
  /\bt\.markup\(\s*['"]([^'"]+)['"]/g,
  /\bt\.raw\(\s*['"]([^'"]+)['"]/g,
  /\bt\(\s*[\r\n]+\s*['"]([^'"]+)['"]/g,
  /\bt\.rich\(\s*[\r\n]+\s*['"]([^'"]+)['"]/g,
  /\bt\.markup\(\s*[\r\n]+\s*['"]([^'"]+)['"]/g,
  /\bt\.raw\(\s*[\r\n]+\s*['"]([^'"]+)['"]/g,
];

const STATIC_TEMPLATE_RES = [
  /\bt\(\s*`([^`${]+)`\s*\)/g,
  /\bt\.rich\(\s*`([^`${]+)`\s*\)/g,
  /\bt\.markup\(\s*`([^`${]+)`\s*\)/g,
  /\bt\.raw\(\s*`([^`${]+)`\s*\)/g,
];

const INDIRECT_UI_PROP_RES =
  /(?:titleKey|descKey|detailKey|labelKey|valueKey|subKey)\s*:\s*['"]([^'"]+)['"]/g;

const QUOTED_SNAKE_CASE_KEY_RES =
  /['"]([a-z][a-z0-9]*(?:_[a-z0-9]+)+)['"]/g;

const MIN_QUOTED_SNAKE_LEN = 10;

function walkScanFiles(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walkScanFiles(full, out);
    } else {
      const ext = path.extname(ent.name);
      if (!SCAN_EXTENSIONS.has(ext)) continue;
      out.push(full);
    }
  }
}

function collectUsedKeysFromSources(scanRoots) {
  const used = new Set();
  const files = [];
  for (const root of scanRoots) {
    const abs = path.isAbsolute(root) ? root : path.join(REPO_ROOT, root);
    if (!fs.existsSync(abs)) continue;
    walkScanFiles(abs, files);
  }
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const re of EXTRACTION_RES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        used.add(m[1]);
      }
    }
    for (const re of STATIC_TEMPLATE_RES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const k = m[1].trim();
        if (k && !k.includes('${')) used.add(k);
      }
    }
    INDIRECT_UI_PROP_RES.lastIndex = 0;
    let mp;
    while ((mp = INDIRECT_UI_PROP_RES.exec(content)) !== null) {
      used.add(mp[1]);
    }
    QUOTED_SNAKE_CASE_KEY_RES.lastIndex = 0;
    let mq;
    while ((mq = QUOTED_SNAKE_CASE_KEY_RES.exec(content)) !== null) {
      const k = mq[1];
      if (k.length >= MIN_QUOTED_SNAKE_LEN) used.add(k);
    }
  }
  return used;
}

function loadLocaleKeys(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (
    typeof data !== 'object' ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error(`Expected object at root: ${filePath}`);
  }
  const keys = Object.keys(data);
  for (const k of keys) {
    const v = data[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      throw new Error(
        `Nested locale objects not supported in ${filePath} (key: ${k}). Flatten first.`,
      );
    }
  }
  return { data, keys };
}

function pruneData(data, usedKeys) {
  const next = {};
  for (const [k, v] of Object.entries(data)) {
    if (usedKeys.has(k)) next[k] = v;
  }
  return next;
}

function parseArgs(argv) {
  const opts = { write: false, files: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') opts.write = true;
    else if (a === '--dry-run') opts.write = false;
    else if (a.startsWith('--files=')) {
      opts.files.push(
        ...a
          .slice('--files='.length)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (a === '--all-locales') {
      opts.allLocales = true;
    } else if (!a.startsWith('-')) {
      opts.files.push(a);
    }
  }
  return opts;
}

function globLocales() {
  const localesRoot = path.join(REPO_ROOT, 'packages', 'closer', 'locales');
  const out = [];

  function walkJson(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walkJson(full);
      else if (ent.name.endsWith('.json')) out.push(full);
    }
  }

  walkJson(localesRoot);
  return out;
}

function main() {
  const opts = parseArgs(process.argv);
  let files = opts.files.length ? opts.files : [];
  if (opts.allLocales || files.length === 0) {
    files = globLocales();
  }
  if (files.length === 0) {
    console.error(
      'Usage: node pruneUnusedLocaleKeys.cjs [--all-locales | --files=a.json,b.json | paths...] [--write]',
    );
    console.error(
      'Default: scans packages/closer/locales/**/*.json when no paths given.',
    );
    process.exit(1);
  }

  const absFiles = files.map((f) =>
    path.isAbsolute(f) ? f : path.join(REPO_ROOT, f),
  );

  const scanRoots = [path.join(REPO_ROOT, 'apps'), path.join(REPO_ROOT, 'packages')];
  console.error('[prune-locale-keys] Scanning sources under apps/ and packages/ ...');
  const usedKeys = collectUsedKeysFromSources(scanRoots);
  console.error(
    `[prune-locale-keys] Found ${usedKeys.size} distinct candidate keys (t()/t.rich()/t.markup/t.raw, static templates, UI props, quoted snake_case ≥${MIN_QUOTED_SNAKE_LEN} chars).`,
  );

  let totalRemoved = 0;
  for (const abs of absFiles) {
    if (!fs.existsSync(abs)) {
      console.error(`[prune-locale-keys] Skip missing file: ${abs}`);
      continue;
    }
    const { data, keys } = loadLocaleKeys(abs);
    const unused = keys.filter((k) => !usedKeys.has(k));
    const next = pruneData(data, usedKeys);
    totalRemoved += unused.length;
    const rel = path.relative(REPO_ROOT, abs);
    console.error(
      `[prune-locale-keys] ${rel}: ${keys.length} keys, ${unused.length} unused (would remove)`,
    );
    if (unused.length && unused.length <= 40) {
      unused.forEach((k) => console.error(`  - ${k}`));
    } else if (unused.length > 40) {
      unused.slice(0, 30).forEach((k) => console.error(`  - ${k}`));
      console.error(`  … and ${unused.length - 30} more`);
    }
    if (opts.write) {
      const serialized = `${JSON.stringify(next, null, 2)}\n`;
      fs.writeFileSync(abs, serialized, 'utf8');
      console.error(`[prune-locale-keys] Wrote ${rel}`);
    }
  }

  if (!opts.write) {
    console.error(
      `[prune-locale-keys] Dry run. ${totalRemoved} unused entries total. Re-run with --write to apply.`,
    );
    console.error(
      '[prune-locale-keys] Not detected (may still be removed incorrectly): t(dynamicVariable), template literals with ${…}, keys only in .md, keys shorter than quoted-snake threshold, keys outside apps|packages scan. Dynamic keys like t(`stay_status_${status}_title`) still need those variants present or manual allowlist; review before --write.',
    );
  }

  process.exit(0);
}

main();
