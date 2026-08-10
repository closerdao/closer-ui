#!/usr/bin/env node

const fs = require('fs-extra');

async function run() {
  try {
    const port = process.env.PORT || 14444;
    const platformName =
      process.env.NEXT_PUBLIC_APP_NAME || process.env.PLATFORM || 'closer';
    const pkg = await fs.readJson('./package.json');
    pkg.name = platformName;
    pkg.scripts.dev = `next dev -p ${port}`;
    pkg.scripts.start = `next start -p ${port}`;
    await fs.writeJson('./package.json', pkg);
    console.log(`Package updated - App set to run on port ${port}.`);
  } catch (err) {
    console.error(err);
  }
}

run();
