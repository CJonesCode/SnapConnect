const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 1. Workaround for a Firebase v9 compatibility issue with Metro.
// This can be removed when the issue is resolved in a future release.
// See: https://docs.expo.dev/guides/using-firebase/#configure-metro
// And: https://github.com/firebase/firebase-js-sdk/issues/7838
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config; 