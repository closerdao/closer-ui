#!/usr/bin/env node

const fs = require('fs-extra');
const config = require('../config');

async function run() {
  try {
    const pkg = await fs.readJson('./package.json');
    pkg.name = config.PLATFORM;
    pkg.scripts.dev = `next dev -p ${config.PORT}`;
    pkg.scripts.start = `next start -p ${config.PORT}`;
    await fs.writeJson('./package.json', pkg);
    console.log(`Package updated - App set to run on port ${config.PORT}.`);
  } catch (err) {
    console.error(err);
  }
}

run();
