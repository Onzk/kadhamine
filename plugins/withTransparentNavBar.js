const { withAndroidStyles } = require('@expo/config-plugins');

/**
 * Forces a fully transparent Android system navigation bar so the app canvas
 * shows through (edge-to-edge). RN's enableEdgeToEdge defaults contrast to true;
 * Expo restores the theme value — this guarantees that value is false.
 */
function withTransparentNavBar(config) {
  return withAndroidStyles(config, (mod) => {
    const styles = mod.modResults.resources.style;
    if (!Array.isArray(styles)) return mod;

    const appTheme = styles.find((s) => s.$?.name === 'AppTheme');
    if (!appTheme) return mod;

    appTheme.item = appTheme.item || [];

    const attrs = {
      'android:enforceNavigationBarContrast': 'false',
      'android:navigationBarColor': '@android:color/transparent',
      'android:windowDrawsSystemBarBackgrounds': 'true',
    };

    for (const [name, value] of Object.entries(attrs)) {
      const existing = appTheme.item.find((i) => i.$?.name === name);
      if (existing) {
        existing._ = value;
        if (name === 'android:enforceNavigationBarContrast') {
          existing.$['tools:targetApi'] = '29';
        }
      } else {
        const item = { $: { name }, _: value };
        if (name === 'android:enforceNavigationBarContrast') {
          item.$['tools:targetApi'] = '29';
        }
        appTheme.item.unshift(item);
      }
    }

    return mod;
  });
}

module.exports = withTransparentNavBar;
