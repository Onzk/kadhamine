module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Must be listed last — required for Reanimated 4 / worklets in release builds.
      'react-native-worklets/plugin',
    ],
  };
};
