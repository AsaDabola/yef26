const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter((e) => e !== 'mjs'),
  'cjs',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand') {
    const zustandDir = path.dirname(require.resolve('zustand/package.json'));
    return { filePath: path.join(zustandDir, 'index.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
