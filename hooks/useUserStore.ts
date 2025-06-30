/**
 * This hook provides a global state management store for the logged-in user's
 * profile data from Firestore.
 */
import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseConfig';

// --- TEMPORARY BYPASS ---
const BYPASS_FIREBASE = true;
// --- END TEMPORARY BYPASS ---

/**
 * Represents the structure of a User document in Firestore.
 */
export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
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

    if (BYPASS_FIREBASE) {
      console.log(`BYPASS: Fetching profile for UID: ${uid}`);
      set({
        profile: {
          uid,
          email: 'testuser@bypass.com',
          displayName: 'Test User',
          photoURL: '',
          friends: ['FRIEND_1_UID', 'FRIEND_2_UID'],
        },
        isLoading: false,
      });
      return;
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        set({ profile: userSnap.data() as UserProfile, isLoading: false });
      } else {
        throw new Error('User document not found.');
      }
    } catch (e) {
      set({ error: e as Error, isLoading: false });
      console.error('Failed to fetch user profile:', e);
    }
  },
  clearProfile: () => set({ profile: null, isLoading: false, error: null }),
})); 