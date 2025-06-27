// app.config.js
import '@expo/env';

export default {
  name: "TheMarketIndex",
  slug: "TheMarketIndex",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "themarketindex",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    googleServicesFile: "./GoogleService-Info.plist",
    bundleIdentifier: "com.anonymous.themarketindex"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.anonymous.themarketindex",
    googleServicesFile: "./google-services.json"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
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
