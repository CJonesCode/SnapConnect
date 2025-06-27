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

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 