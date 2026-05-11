const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'generated', 'appConfig.snapshot.json');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
if (!fs.existsSync(OUT)) {
  fs.writeFileSync(OUT, '{}\n', 'utf8');
}
