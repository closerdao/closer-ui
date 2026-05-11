'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const chokidar = require('chokidar');

const SCRIPT_DIR = __dirname;
const PACKAGES_CLOSER = path.join(SCRIPT_DIR, '..');
const LOCALES_DIR = path.join(PACKAGES_CLOSER, 'locales');
const SYNC_SCRIPT = path.join(SCRIPT_DIR, 'syncBuildLocales.cjs');

const DEBOUNCE_MS = 400;
let timer;

function runSync() {
  console.log(`[watch:locales] ${new Date().toISOString()} build:locales`);
  execFileSync(process.execPath, [SYNC_SCRIPT], {
    stdio: 'inherit',
    cwd: PACKAGES_CLOSER,
  });
}

function schedule() {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    try {
      runSync();
    } catch (e) {
      console.error('[watch:locales] sync failed', e);
    }
  }, DEBOUNCE_MS);
}

chokidar
  .watch(LOCALES_DIR, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  })
  .on('all', () => {
    schedule();
  });

console.log('[watch:locales] watching', LOCALES_DIR);
