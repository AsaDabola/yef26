const fs = require('fs');
const path = require('path');

// Valid 1x1 white PNG — signature, IHDR, IDAT, IEND all with verified CRC32
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
  'base64'
);

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

['icon.png', 'splash.png', 'favicon.png', 'adaptive-icon.png'].forEach((name) => {
  fs.writeFileSync(path.join(assetsDir, name), PNG);
  console.log('Created', name);
});

console.log('Done.');
