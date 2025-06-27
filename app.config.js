// app.config.js
import '@expo/env';
const tailwind = require('./tailwind.config.js');

const a = tailwind.theme.extend.colors;

export default {
  name: "TheMarketIndex",
  slug: "TheMarketIndex",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "themarketindex",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: a.background,
    dark: {
      backgroundColor: a.dark.background,
    },
  },
  ios: {
    supportsTablet: true,
    googleServicesFile: "./GoogleService-Info.plist",
    bundleIdentifier: "com.anonymous.themarketindex"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: a.dark.background,
    },
    package: "com.anonymous.themarketindex",
    googleServicesFile: "./google-services.json"
  },
  plugins: [
    "expo-router",
    "expo-notifications",
    "expo-secure-store"
  ],
  experiments: {
    typedRoutes: true
  },
};
