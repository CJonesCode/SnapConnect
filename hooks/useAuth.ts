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
import { useUserStore, UserProfile } from './useUserStore';
import {
  savePushToken,
} from '@/services/firebase/userService';
import { SignUpCredentials } from '@/app/(auth)';

// --- Type Definitions ---
export type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  pushToken: string | null;
  init: () => () => void; // The init function returns an unsubscribe function
  setPushToken: (token: string) => void;
};

// --- Zustand Store for Auth ---
const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isInitialized: false,
  isAuthenticated: false,
  pushToken: null,

  setPushToken: (token: string) => {
    set({ pushToken: token });
    const user = get().user;
    if (user && token) {
      savePushToken(user.uid, token).catch((e) =>
        logger.error('Failed to save push token after state update', e)
      );
    }
  },

  init: () => {
    logger.info('Auth store init: Setting up onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.info('onAuthStateChanged triggered.');
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Correctly set the profile in useUserStore
          useUserStore.setState({ profile: userData as UserProfile });
          logger.info('User profile loaded.', { uid: user.uid });

          const token = get().pushToken;
          if (token) {
            await savePushToken(user.uid, token);
          }
        } else {
          logger.warn('User document not found in Firestore.', { uid: user.uid });
          useUserStore.setState({ profile: null });
        }
        set({ user, isInitialized: true, isAuthenticated: true, isLoading: false });
      } else {
        logger.info('User is not authenticated.');
        useUserStore.setState({ profile: null });
        set({ user: null, isInitialized: true, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
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
      setError(error.message);
      setLoading(false);
      throw error;
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
      logger.error('Sign in failed', error);
      setError(error.message);
      setLoading(false);
      throw error;
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
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      useUserStore.getState().clearProfile();
      setLoading(false);
    } catch (error: any) {
      logger.error('Sign out failed', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  return { ...authState, signUp, signIn, signOut, setError, deleteAccount };
} 
