const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Drop .mjs so Metro never picks up ESM builds that contain import.meta
config.resolver.sourceExts = config.resolver.sourceExts.filter((e) => e !== 'mjs');

// Force zustand to CJS on native only — web handles ESM fine
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === 'zustand') {
    const pkgDir = path.dirname(require.resolve('zustand/package.json'));
    return { filePath: path.join(pkgDir, 'index.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
