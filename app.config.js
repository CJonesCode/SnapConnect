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
    infoPlist: {
      NSCameraUsageDescription: 'TheMarketIndex needs camera access to take photos and record videos for sharing market tips with friends.',
      NSMicrophoneUsageDescription: 'TheMarketIndex needs microphone access to record audio with your market analysis videos.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/logo.png',
      backgroundColor: '#121212',
    },
    package: 'com.anonymous.themarketindex',
    googleServicesFile: './google-services.json',
    permissions: [
      'android.permission.RECORD_AUDIO',
    ],
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission:
          'TheMarketIndex needs camera access to take photos and record videos for sharing market tips with friends.',
        microphonePermission:
          'TheMarketIndex needs microphone access to record audio with your market analysis videos.',
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
