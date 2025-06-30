/**
 * This file provides a centralized authentication hook (`useAuth`) using Zustand for state management.
 * It handles user session, authentication state, and integrates with the `useUserStore`
 * to fetch and manage the logged-in user's profile data from Firestore.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { auth, db } from '@/services/firebase/firebaseConfig';
import { logger } from '@/services/logging/logger';
import { cleanupAllListeners } from '@/services/firebase/listenerManager';
import { useUserStore, UserProfile } from './useUserStore';
import { SignUpCredentials } from '@/app/(auth)';
import { 
  registerForPushNotifications, 
  unregisterPushNotifications,
  setupNotificationListeners 
} from '@/services/notificationService';

// --- Type Definitions ---
export type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  init: () => () => void; // The init function returns an unsubscribe function
};

// --- Global Auth Listener ---
let globalAuthUnsubscribe: (() => void) | null = null;

// --- Zustand Store for Auth ---
const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isInitialized: false,
  isAuthenticated: false,

  init: () => {
    // Clean up any existing listener first
    if (globalAuthUnsubscribe) {
      globalAuthUnsubscribe();
      globalAuthUnsubscribe = null;
    }
    
    logger.info('Setting up auth state listener');
    
    globalAuthUnsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        logger.info(`Auth state changed - ${user ? `signed in` : 'signed out'}`);
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            useUserStore.setState({ profile: userData as UserProfile });
            logger.info(`Profile loaded for ${userData.displayName || user.uid}`);

            // Register for push notifications on successful sign in
            try {
              await registerForPushNotifications(user.uid);
            } catch (error) {
              logger.warn('Failed to register for push notifications', { error });
            }
          } else {
            logger.warn(`User document not found for ${user.uid}`);
            useUserStore.setState({ profile: null });
          }
          useAuthStore.setState({ user, isInitialized: true, isAuthenticated: true, isLoading: false });
        } else {
          useUserStore.setState({ profile: null });
          useAuthStore.setState({ user: null, isInitialized: true, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        logger.error('Error in auth state change', { error: String(error) });
      }
    });
    
    return globalAuthUnsubscribe;
  },
}));

// --- Main Auth Hook ---
export function useAuth() {
  const authState = useAuthStore();
  const { fetchProfile } = useUserStore();

  useEffect(() => {
    // Get the init function directly from the store to avoid a dependency loop.
    // The empty dependency array [] ensures this runs only once.
    const unsubscribe = useAuthStore.getState().init();
    return () => unsubscribe();
  }, []);

  const setLoading = (isLoading: boolean) => useAuthStore.setState({ isLoading });
  const setError = (error: string | null) => useAuthStore.setState({ error });

  const signUp = async ({ email, password, displayName }: SignUpCredentials) => {
    setLoading(true);
    setError(null);
    if (!displayName) {
      const err = new Error('Sign up validation failed: displayName is missing.');
      logger.error('Sign up validation failed', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // --- Create user and username docs in a transaction ---
      const username = email.split('@')[0].toLowerCase();
      if (username.length > 24) {
        throw new Error('Username (from email) must be 24 characters or less.');
      }
      const userDocRef = doc(db, 'users', user.uid);
      const usernameDocRef = doc(db, 'usernames', username);

      await runTransaction(db, async (transaction) => {
        const usernameDoc = await transaction.get(usernameDocRef);
        if (usernameDoc.exists()) {
          // This error will be caught by the outer catch block
          throw new Error('This username is already taken.');
        }

        // Define user data
        const trimmedDisplayName = displayName.trim();
        const newUserProfile = {
          uid: user.uid,
          username,
          displayName: trimmedDisplayName,
          displayName_lowercase: trimmedDisplayName.toLowerCase(),
          email,
          photoURL: `https://i.pravatar.cc/150?u=${user.uid}`, // User-specific placeholder
          friends: [],
          createdAt: serverTimestamp(),
        };

        // Set the user and username documents
        transaction.set(userDocRef, newUserProfile);
        transaction.set(usernameDocRef, { uid: user.uid });
      });

      await fetchProfile(user.uid); // Fetch profile after creation
      setLoading(false);
      return userCredential;
    } catch (error: any) {
      logger.error('Sign up failed', error);
      let errorMessage = 'Could not create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email address already exists.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchProfile(userCredential.user.uid);
      setLoading(false);
      return userCredential;
    } catch (error: any) {
      logger.error('Sign in failed', { code: error.code });
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in.');
      }
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);
      logger.info('User account deleted successfully.');
      setLoading(false);
    } catch (error: any) {
      logger.error('Failed to delete user account', error);
      let errorMessage = 'Failed to delete account.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'The password you entered is incorrect.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.info('Starting logout process');
      
      // Unregister push notifications before signing out
      if (authState.user) {
        try {
          await unregisterPushNotifications(authState.user.uid);
        } catch (error) {
          logger.warn('Failed to unregister push notifications', { error });
        }
      }
      
      // Clean up all Firestore listeners immediately
      cleanupAllListeners();
      
      // Clear user profile to trigger component state updates
      useUserStore.getState().clearProfile();
      
      // Sign out from Firebase (this will trigger onAuthStateChanged)
      await firebaseSignOut(auth);
      
      logger.info('Logout completed successfully');
      setLoading(false);
    } catch (error: any) {
      logger.error('Logout failed', { error: String(error) });
      setError('Failed to sign out. Please try again.');
      setLoading(false);
    }
  };

  return { ...authState, signUp, signIn, signOut, setError, deleteAccount };
} 
