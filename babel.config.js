module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'babel-plugin-transform-import-meta',
      'react-native-reanimated/plugin',
    ],
  };
};
