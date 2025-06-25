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

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:your-sender-id:web:your-app-id",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 