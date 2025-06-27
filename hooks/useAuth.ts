/**
 * This hook provides authentication state and actions for the entire app.
 * It uses Zustand for state management and Firebase for authentication.
 * The onAuthStateChanged listener is set up once at the module level to
 * prevent re-renders and ensure a single source of truth for auth state.
 */
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
import { logger } from '@/services/logging/logger';

// --- Helper function for user-friendly error messages ---
function getFriendlyAuthError(error: any): string {
  if (!error || !error.code) {
    return 'An unexpected error occurred. Please try again.';
  }
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

const USER_SESSION_KEY = 'userSession';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

const useAuthStore = create<AuthState>(() => ({
  user: null,
  isLoading: true, // Start in a loading state until the first auth check completes.
  error: null,
}));

// --- Initialize Auth Listener (Runs once on app startup) ---
logger.info('Setting up global onAuthStateChanged listener...');
onAuthStateChanged(auth, async (firebaseUser) => {
  const { fetchProfile, clearProfile } = useUserStore.getState();

  if (firebaseUser) {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(firebaseUser));
    await fetchProfile(firebaseUser.uid);
    useAuthStore.setState({ user: firebaseUser, isLoading: false, error: null });
    logger.info('Auth state updated: User is authenticated.', { uid: firebaseUser.uid });
  } else {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
    clearProfile();
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    logger.info('Auth state updated: User is not authenticated.');
  }
});

// --- Main Auth Hook ---
export function useAuth() {
  const { user, isLoading, error } = useAuthStore();

  const setLoading = (loading: boolean) => useAuthStore.setState({ isLoading: loading });
  const setError = (authError: string | null) => useAuthStore.setState({ error: authError });

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    logger.info('Attempting to sign up user.', { email });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.info('Sign up successful.', { uid: userCredential.user.uid });
      // The onAuthStateChanged listener will handle setting the user state.
      if (userCredential.user) {
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: '',
          photoURL: '',
          friends: [],
        });
      }
      return userCredential;
    } catch (e: any) {
      const friendlyError = getFriendlyAuthError(e);
      logger.error('Sign up failed.', { email, error: e?.code });
      setError(friendlyError);
      setLoading(false);
      throw e;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    logger.info('Attempting to sign in user.', { email });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.info('Sign in successful.', { uid: userCredential.user.uid });
      // The onAuthStateChanged listener will handle setting the user state.
      return userCredential;
    } catch (e: any) {
      const friendlyError = getFriendlyAuthError(e);
      logger.error('Sign in failed.', { email, error: e?.code });
      setError(friendlyError);
      setLoading(false);
      throw e;
    }
  };

  const signOut = async () => {
    const uid = useAuthStore.getState().user?.uid;
    logger.info('Attempting to sign out user.', { uid });
    // Setting loading state here is optional as onAuthStateChanged will manage it.
    try {
      await firebaseSignOut(auth);
      logger.info('Sign out successful.', { uid });
    } catch (e: any) {
      const friendlyError = getFriendlyAuthError(e);
      logger.error('Sign out failed.', { uid, error: e?.code });
      setError(friendlyError);
    }
  };

  return { user, isLoading, error, signUp, signIn, signOut, setError };
} 