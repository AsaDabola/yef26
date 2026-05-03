const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Only allow CJS and standard JS extensions; exclude mjs to prevent Metro
// from accidentally resolving ESM builds that contain import.meta syntax
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter((e) => e !== 'mjs'),
  'cjs',
];

// Force zustand (and any other package) to use its CJS main build rather than
// the ESM exports that contain import.meta which breaks the Metro web bundle
const path = require('path');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force zustand to CJS to avoid its ESM build which has import.meta.env
  if (moduleName === 'zustand') {
    const zustandDir = path.dirname(require.resolve('zustand/package.json'));
    return { filePath: path.join(zustandDir, 'index.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
