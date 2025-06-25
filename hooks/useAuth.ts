/**
 * This hook provides authentication state and actions for the entire app.
 * It uses Zustand for state management and Firebase for authentication.
 * User session is persisted using Expo's SecureStore.
 */
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { auth, db } from '../services/firebase/firebaseConfig';
import { useUserStore } from './useUserStore';

// --- TEMPORARY BYPASS ---
// This flag skips the Firebase connection for UI development.
// Set this to `false` once you have added your Firebase credentials.
const BYPASS_FIREBASE_AUTH = true;
// --- END TEMPORARY BYPASS ---

const USER_SESSION_KEY = 'userSession';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchProfile, clearProfile } = useUserStore();

  useEffect(() => {
    // --- TEMPORARY BYPASS LOGIC ---
    if (BYPASS_FIREBASE_AUTH) {
      setLoading(false);
      setIsInitialized(true);
      setUser(null);
      return;
    }
    // --- END TEMPORARY BYPASS LOGIC ---

    const checkStoredSession = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync(USER_SESSION_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user session from secure store.', e);
        setError(e as Error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkStoredSession();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(firebaseUser));
        await fetchProfile(firebaseUser.uid);
      } else {
        setUser(null);
        await SecureStore.deleteItemAsync(USER_SESSION_KEY);
        clearProfile();
      }
      if (isInitialized) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setError, isInitialized, fetchProfile, clearProfile]);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // --- TEMPORARY BYPASS LOGIC ---
      if (BYPASS_FIREBASE_AUTH) {
        console.log('BYPASS: Signing up with', { email, password });
        console.log('BYPASS: Would create user document in Firestore here.');
        // To see the UI flow, we'll simulate a successful sign-up by setting a mock user.
        // In a real scenario, the onAuthStateChanged listener would handle this.
        setUser({ uid: 'mock-user-id', email } as any);
        return;
      }
      // --- END TEMPORARY BYPASS LOGIC ---
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create a user document in Firestore
      if (userCredential.user) {
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: '', // Can be set later from a profile screen
          photoURL: '', // Can be set later
          friends: [],
        });
      }

      return userCredential;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // --- TEMPORARY BYPASS LOGIC ---
      if (BYPASS_FIREBASE_AUTH) {
        console.log('BYPASS: Signing in with', { email, password });
        // Simulate a successful sign-in by setting a mock user.
        setUser({ uid: 'mock-user-id', email } as any);
        return;
      }
      // --- END TEMPORARY BYPASS LOGIC ---
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- TEMPORARY BYPASS LOGIC ---
      if (BYPASS_FIREBASE_AUTH) {
        console.log('BYPASS: Signing out');
        setUser(null);
        clearProfile();
        return;
      }
      // --- END TEMPORARY BYPASS LOGIC ---
      await firebaseSignOut(auth);
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { user, isLoading: isLoading || !isInitialized, error, signUp, signIn, signOut };
} 