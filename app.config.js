// app.config.js
import '@expo/env';

export default {
  name: 'TheMarketIndex',
  slug: 'TheMarketIndex',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/logo.png',
  scheme: 'themarketindex',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    dark: {
      backgroundColor: '#121212',
    },
  },
  ios: {
    supportsTablet: true,
    googleServicesFile: './GoogleService-Info.plist',
    bundleIdentifier: 'com.anonymous.themarketindex',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/logo.png',
      backgroundColor: '#121212',
    },
    package: 'com.anonymous.themarketindex',
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow $(PRODUCT_NAME) to access your camera to take photos.',
        microphonePermission:
          'Allow $(PRODUCT_NAME) to access your microphone for video recording.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 23,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};
