const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (blue tint to match YEF brand)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADggHAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

['icon.png', 'splash.png', 'favicon.png', 'adaptive-icon.png'].forEach((name) => {
  const dest = path.join(assetsDir, name);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, PNG);
    console.log('Created', name);
  } else {
    console.log('Skipped', name, '(already exists)');
  }
});

console.log('Done. Replace these with real images before releasing the app.');
