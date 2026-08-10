const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'generated', 'locales');

fs.mkdirSync(ROOT, { recursive: true });
