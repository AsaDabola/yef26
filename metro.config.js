const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Drop .mjs so Metro never picks up ESM builds that contain import.meta
config.resolver.sourceExts = config.resolver.sourceExts.filter((e) => e !== 'mjs');

// Force specific packages to their CJS builds
const CJS_OVERRIDES = {
  zustand: 'index.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (Object.prototype.hasOwnProperty.call(CJS_OVERRIDES, moduleName)) {
    const pkgDir = path.dirname(require.resolve(`${moduleName}/package.json`));
    return { filePath: path.join(pkgDir, CJS_OVERRIDES[moduleName]), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
