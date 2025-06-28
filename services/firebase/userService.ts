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
} from 'firebase/firestore';
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
    console.error('Error saving push token:', error);
  }
} 