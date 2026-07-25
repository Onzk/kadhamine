/**
 * Expo app config — reads ANDROID_ABI_FILTERS from the EAS build profile env
 * (comma-separated), e.g. "arm64-v8a" or "arm64-v8a,armeabi-v7a".
 */
const appJson = require('./app.json');

const DEFAULT_ABIS = ['arm64-v8a', 'armeabi-v7a'];

function resolveAbiFilters() {
  const raw = process.env.ANDROID_ABI_FILTERS?.trim();
  if (!raw) return DEFAULT_ABIS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const abiFilters = resolveAbiFilters();

const plugins = (appJson.expo.plugins ?? []).map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
    return [
      'expo-build-properties',
      {
        ...plugin[1],
        android: {
          ...(plugin[1]?.android ?? {}),
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          buildArchs: abiFilters,
          extraProguardRules:
            plugin[1]?.android?.extraProguardRules ??
            '-keep class com.facebook.react.** { *; }\n-keep class com.facebook.hermes.** { *; }\n-keep class com.swmansion.** { *; }\n-dontwarn com.facebook.react.**\n-dontwarn com.facebook.hermes.**',
        },
      },
    ];
  }
  return plugin;
});

module.exports = {
  ...appJson.expo,
  plugins,
  extra: {
    ...appJson.expo.extra,
    androidAbiFilters: abiFilters,
  },
};
