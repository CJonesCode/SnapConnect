/**
 * This file initializes the Firebase application and exports the necessary Firebase services.
 *
 * Before running the application, you must replace the placeholder Firebase configuration
 * with your own project's configuration from the Firebase console.
 *
 * To get your Firebase config:
 * 1. Go to your Firebase project console.
 * 2. In the project settings, find the "Your apps" card.
 * 3. Select the web app for which you want to get the configuration object.
 * 4. In the app's settings, find the "Firebase SDK snippet" section and select "Config".
 * 5. Copy the firebaseConfig object and replace the placeholder below.
 */

import { Platform } from 'react-native';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Platform.select({
    ios: process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID,
    android: process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
  }),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 