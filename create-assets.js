const fs = require('fs');
const path = require('path');

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
