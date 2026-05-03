const fs = require('fs');
const path = require('path');

// Valid 1x1 white PNG (base64, CRC-correct)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
  'base64'
);

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

['icon.png', 'splash.png', 'favicon.png', 'adaptive-icon.png'].forEach((name) => {
  fs.writeFileSync(path.join(assetsDir, name), PNG);
  console.log('Created', name);
});

console.log('Done.');
