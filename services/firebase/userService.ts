/**
 * This service handles all user-related interactions with Firebase,
 * such as searching for users and managing friend relationships.
 */
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
  deleteDoc,
  runTransaction,
  setDoc,
  writeBatch,
  documentId,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Represents the structure of a public user profile document in Firestore.
 */
export type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  displayName_lowercase: string;
  photoURL?: string;
};

/**
 * Represents a friendship document in the 'friendships' collection.
 */
export type Friendship = {
  id: string; // The composite document ID (e.g., uid1_uid2)
  members: [string, string]; // Array of the two user UIDs
  requestedBy: string; // UID of the user who sent the request
  status: 'pending' | 'accepted';
  createdAt: any;
};

/**
 * Searches for users by their display name.
 * Note: This requires a Firestore index on the 'users' collection for the 'displayName' field.
 * @param searchText - The text to search for in usernames or display names.
 * @returns A promise that resolves to an array of user profiles matching the search query.
 */
export async function searchUsers(searchText: string): Promise<UserProfile[]> {
  const trimmedSearchText = searchText.trim();
  if (!trimmedSearchText) {
    return [];
  }

  const usersRef = collection(db, 'users');
  const lowercasedSearchText = trimmedSearchText.toLowerCase();

  // Query by username (case-insensitive prefix match)
  const usernameQuery = query(
    usersRef,
    where('username', '>=', lowercasedSearchText),
    where('username', '<=', lowercasedSearchText + '\uf8ff'),
    limit(10)
  );

  // Query by displayName (case-insensitive prefix match)
  const displayNameQuery = query(
    usersRef,
    where('displayName_lowercase', '>=', lowercasedSearchText),
    where('displayName_lowercase', '<=', lowercasedSearchText + '\uf8ff'),
    limit(10)
  );

  try {
    const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(displayNameQuery),
    ]);

    const usersMap = new Map<string, UserProfile>();

    // Helper to process snapshots and add unique users to the map
    const processSnapshot = (snapshot: typeof usernameSnapshot) => {
      snapshot.forEach((doc) => {
        if (!usersMap.has(doc.id)) {
      const data = doc.data();
          usersMap.set(doc.id, {
        uid: doc.id,
            username: data.username,
        displayName: data.displayName,
            displayName_lowercase: data.displayName_lowercase,
        photoURL: data.photoURL,
      });
        }
      });
    };

    processSnapshot(usernameSnapshot);
    processSnapshot(displayNameSnapshot);

    return Array.from(usersMap.values());
  } catch (error) {
    console.error('Error searching for users:', error);
    // This will alert you in the console if a composite index is needed.
    // Example Firestore error message: "The query requires an index..."
    throw new Error('Failed to search for users.');
  }
}

/**
 * Creates a composite ID for a friendship document.
 * @param uid1 The first user's UID.
 * @param uid2 The second user's UID.
 * @returns A sorted, concatenated string ID.
 */
function createFriendshipId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Sends a friend request from one user to another.
 * This creates a document in the 'friendships' collection.
 * @param fromUserId - The UID of the user sending the request.
 * @param toUserId - The UID of the user receiving the request.
 */
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
  if (fromUserId === toUserId) {
    throw new Error('You cannot send a friend request to yourself.');
  }
  const friendshipId = createFriendshipId(fromUserId, toUserId);
  const friendshipRef = doc(db, 'friendships', friendshipId);

  try {
    await setDoc(friendshipRef, {
      members: [fromUserId, toUserId].sort(),
      requestedBy: fromUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw new Error('Failed to send friend request.');
  }
}

/**
 * Listens for incoming friend requests in real-time.
 * @param userId - The UID of the current user.
 * @param onNext - Callback function that receives the array of friend requests.
 * @returns An unsubscribe function to stop listening for updates.
 */
export function subscribeToFriendRequests(
  userId: string,
  onNext: (requests: Friendship[]) => void
): () => void {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(
    friendshipsRef,
    where('members', 'array-contains', userId),
    where('status', '==', 'pending')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const requests: Friendship[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // The user should not see requests they sent
        if (data.requestedBy !== userId) {
          requests.push({ id: doc.id, ...data } as Friendship);
        }
      });
      onNext(requests);
    },
    (error) => {
      console.error('Error listening to friend requests:', error);
    }
  );

  return unsubscribe;
}

/**
 * Accepts a friend request using a transaction to ensure atomicity.
 * It adds each user to the other's friends list and deletes the request document.
 * @param request The friend request object.
 */
export async function acceptFriendRequest(request: Friendship): Promise<void> {
  const friendshipRef = doc(db, 'friendships', request.id);
  try {
    await updateDoc(friendshipRef, { status: 'accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw new Error('Failed to accept friend request.');
  }
}

/**
 * Declines a friend request.
 * This simply deletes the request document from the user's `friendships` collection.
 * @param request The friend request object.
 */
export async function declineFriendRequest(request: Friendship): Promise<void> {
  const friendshipRef = doc(db, 'friendships', request.id);
  try {
    await deleteDoc(friendshipRef);
  } catch (error) {
    console.error('Error declining friend request:', error);
    throw new Error('Failed to decline friend request.');
  }
}

/**
 * Listens for real-time updates to a user's friends list and fetches the
 * full profile for each friend.
 *
 * Note: Firestore 'in' queries are limited to 30 items per query. For larger
 * friends lists, this function would need to be adapted to perform multiple queries.
 *
 * @param userId The UID of the user whose friends to listen for.
 * @param onUpdate A callback function that receives the updated list of friend profiles.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToFriends(
  userId: string,
  onUpdate: (friends: UserProfile[]) => void
): () => void {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(
    friendshipsRef,
    where('members', 'array-contains', userId),
    where('status', '==', 'accepted')
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const friendIds = snapshot.docs
      .map((doc) => {
        const members = doc.data().members as [string, string];
        return members.find((uid) => uid !== userId);
      })
      .filter((uid): uid is string => !!uid);

    if (friendIds.length === 0) {
      onUpdate([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where(documentId(), 'in', friendIds));
    try {
      const usersSnapshot = await getDocs(usersQuery);
      const friends = usersSnapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
      );
      onUpdate(friends);
    } catch (error) {
      console.error('Error fetching friend profiles:', error);
      onUpdate([]);
    }
  });

  return unsubscribe;
}

/**
 * Saves a user's Expo Push Token to their user document in Firestore.
 * This uses `setDoc` with `merge: true` to create or update the field.
 *
 * @param userId The UID of the user.
 * @param token The Expo Push Token string.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { pushToken: token });
  } catch (error) {
    console.error('Error saving push token', error);
    throw new Error('Failed to save push token.');
  }
}

/**
 * Updates a user's profile information in Firestore.
 * If the displayName is being updated, it also updates the
 * displayName_lowercase field to ensure case-insensitive search continues to work.
 *
 * @param userId The UID of the user to update.
 * @param profileData The profile data to update.
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  // Create a mutable copy to avoid modifying the original object
  const dataToUpdate: { [key: string]: any } = { ...profileData };

  // If the displayName is part of the update, also update the lowercase version
  if (profileData.displayName) {
    dataToUpdate.displayName_lowercase = profileData.displayName.toLowerCase();
  }

  try {
    await updateDoc(userRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile.');
  }
} 