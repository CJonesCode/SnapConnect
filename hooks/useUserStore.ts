/**
 * This hook provides a global state management store for the logged-in user's
 * profile data from Firestore.
 */
import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseConfig';

/**
 * Represents the structure of a User document in Firestore.
 */
export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  displayName_lowercase: string;
  photoURL: string;
  friends: string[];
};

type UserState = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  fetchProfile: (uid: string) => Promise<void>;
  clearProfile: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: async (uid: string) => {
    set({ isLoading: true, error: null });

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        set({ profile: userSnap.data() as UserProfile, isLoading: false });
      } else {
        console.warn(`User document not found for UID: ${uid}. This may be expected during sign-up.`);
        set({ profile: null, isLoading: false });
      }
    } catch (e) {
      set({ error: e as Error, isLoading: false });
      console.error('Failed to fetch user profile:', e);
    }
  },
  clearProfile: () => set({ profile: null, isLoading: false, error: null }),
})); 