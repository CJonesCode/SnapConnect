/**
 * This service handles all user-related interactions with Firebase,
 * such as searching for users and managing friend relationships.
 */
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Represents the structure of a public user profile document in Firestore.
 */
export type UserProfile = {
  uid: string;
  displayName: string;
  photoURL?: string;
};

/**
 * Searches for users by their display name.
 * Note: This requires a Firestore index on the 'users' collection for the 'displayName' field.
 * @param displayName - The display name to search for.
 * @returns A promise that resolves to an array of user profiles matching the search query.
 */
export async function searchUsers(displayName: string): Promise<UserProfile[]> {
  if (!displayName.trim()) {
    return [];
  }

  const usersRef = collection(db, 'users');
  const searchQuery = query(
    usersRef,
    where('displayName', '>=', displayName),
    where('displayName', '<=', displayName + '\uf8ff')
  );

  try {
    const querySnapshot = await getDocs(searchQuery);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure you cast the data to the expected type, including the document ID as uid
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    });
    return users;
  } catch (error) {
    console.error('Error searching for users:', error);
    // This will alert you in the console if a composite index is needed.
    // Example Firestore error message: "The query requires an index..."
    throw new Error('Failed to search for users.');
  }
} 