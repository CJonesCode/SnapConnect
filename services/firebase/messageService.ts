/**
 * This service handles all messaging-related interactions with Firebase,
 * such as sending and receiving messages in groups.
 */
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Represents the structure of a Message document in a group's `messages` subcollection.
 */
export type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};

/**
 * Sends a message to a specific group chat.
 *
 * @param groupId - The ID of the group to send the message to.
 * @param message - An object containing the message text and sender's UID.
 */
export async function sendMessageToGroup(
  groupId: string,
  message: { text: string; senderId: string },
): Promise<void> {
  if (!message.text.trim()) {
    throw new Error('Message text cannot be empty.');
  }

  try {
    const messagesCollection = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesCollection, {
      ...message,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending message to group:', error);
    throw new Error('Failed to send message.');
  }
}

/**
 * Listens for real-time updates to messages in a group chat.
 *
 * @param groupId The ID of the group to listen to.
 * @param onUpdate A callback function that receives the updated list of messages.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToGroupMessages(
  groupId: string,
  onUpdate: (messages: Message[]) => void,
): () => void {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });
      onUpdate(messages);
    },
    (error) => {
      console.error('Error listening to group messages:', error);
      onUpdate([]);
    },
  );

  return unsubscribe;
}
