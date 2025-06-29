/**
 * This service handles all group-related interactions with Firebase,
 * such as creating new groups and managing memberships.
 */
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Represents the structure of a Group document in Firestore.
 */
export type Group = {
  id: string;
  name: string;
  members: string[]; // Array of user UIDs
  createdAt: any;
  createdBy: string;
};

/**
 * Creates a new group chat.
 *
 * @param name - The name of the group.
 * @param memberIds - An array of UIDs for the initial members, including the creator.
 * @param createdBy - The UID of the user creating the group.
 * @returns The ID of the newly created group.
 */
export async function createGroup(
  name: string,
  memberIds: string[],
  createdBy: string,
): Promise<string> {
  if (!name.trim()) {
    throw new Error('Group name cannot be empty.');
  }
  if (memberIds.length < 2) {
    throw new Error('A group must have at least two members.');
  }

  try {
    const groupsCollection = collection(db, 'groups');
    const newGroupDoc = await addDoc(groupsCollection, {
      name,
      members: memberIds,
      createdBy,
      createdAt: serverTimestamp(),
    });
    return newGroupDoc.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw new Error('Failed to create group.');
  }
}

/**
 * Listens for real-time updates to the groups a user is a member of.
 *
 * @param userId The UID of the user.
 * @param onUpdate A callback function that receives the updated list of groups.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToGroups(
  userId: string,
  onUpdate: (groups: Group[]) => void,
): () => void {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('members', 'array-contains', userId));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const groups: Group[] = [];
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data(),
        } as Group);
      });
      onUpdate(groups);
    },
    (error) => {
      console.error('Error listening to groups:', error);
      onUpdate([]);
    },
  );

  return unsubscribe;
}
