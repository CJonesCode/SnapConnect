/**
 * This service handles all interactions with Firebase related to Tips,
 * including creating and fetching ephemeral messages.
 */
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, where, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { logger } from '../logging/logger';

/**
 * Represents the structure of a Tip document in Firestore.
 */
export interface Tip {
  id: string;
  senderId: string;
  recipientId: string;
  mediaUrl: string;
  ticker?: string; // Optional: The stock symbol being discussed
  tip?: string; // Optional: A short text description or analysis
  viewed: boolean;
  isSignal?: boolean; // Optional: true if this tip was sent as a signal (broadcast)
  createdAt: any;
  expiresAt: any;
}

/**
 * Creates a new tip document in Firestore.
 * @param senderId The UID of the user sending the tip.
 * @param recipientId The UID of the user receiving the tip.
 * @param mediaUrl The URL of the uploaded media for the tip.
 * @param data Optional data including a stock ticker and a text tip.
 * @returns The ID of the newly created tip document.
 */
export async function createTip(
  senderId: string,
  recipientId: string,
  mediaUrl: string,
  data?: { ticker?: string; tip?: string }
): Promise<string> {
  try {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Expires in 24 hours

    const docRef = await addDoc(collection(db, 'tips'), {
      senderId,
      recipientId,
      mediaUrl,
      ticker: data?.ticker || '',
      tip: data?.tip || '',
      viewed: false,
      createdAt: serverTimestamp(),
      expiresAt: expiryDate,
    });
    logger.info('Tip document created', { tipId: docRef.id });
    return docRef.id;
  } catch (error) {
    logger.error('Error creating tip:', { error });
    throw new Error('Failed to create tip.');
  }
}

/**
 * Fetches all active, unviewed tips for a specific user.
 * @param userId The UID of the user to fetch tips for.
 * @returns A promise that resolves to an array of Tip objects.
 */
export async function getTipsForUser(userId: string): Promise<Tip[]> {
  try {
    const tipsRef = collection(db, 'tips');
    const q = query(
      tipsRef,
      where('recipientId', '==', userId),
      where('viewed', '==', false),
      where('expiresAt', '>', new Date()),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const tips = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Tip));
    logger.info(`Fetched ${tips.length} tips for user`, { userId });
    return tips;
  } catch (error) {
    logger.error('Error fetching tips for user:', { userId, error });
    throw new Error('Failed to fetch tips.');
  }
}

/**
 * Marks a specific tip as viewed.
 * @param tipId The ID of the tip to update.
 */
export async function markTipAsViewed(tipId: string): Promise<void> {
  try {
    const tipRef = doc(db, 'tips', tipId);
    await updateDoc(tipRef, { viewed: true });
    logger.info('Marked tip as viewed', { tipId });
  } catch (error) {
    logger.error('Error marking tip as viewed:', { tipId, error });
    throw new Error('Failed to mark tip as viewed.');
  }
}

/**
 * Creates a signal (broadcast tip) sent to all friends of the user.
 * This creates individual tip documents for each friend.
 * @param senderId The UID of the user sending the signal.
 * @param friendIds Array of friend UIDs to send the signal to.
 * @param mediaUrl The URL of the uploaded media for the signal.
 * @param data Optional data including a stock ticker and a text tip.
 * @returns Promise that resolves when all tips are created.
 */
export async function createSignalTip(
  senderId: string,
  friendIds: string[],
  mediaUrl: string,
  data?: { ticker?: string; tip?: string }
): Promise<void> {
  try {
    if (friendIds.length === 0) {
      throw new Error('No friends to send signal to.');
    }

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Expires in 24 hours

    // Create individual tip documents for each friend
    const tipPromises = friendIds.map(friendId => 
      addDoc(collection(db, 'tips'), {
        senderId,
        recipientId: friendId,
        mediaUrl,
        ticker: data?.ticker || '',
        tip: data?.tip || '',
        viewed: false,
        isSignal: true, // Mark as signal to distinguish from regular tips
        createdAt: serverTimestamp(),
        expiresAt: expiryDate,
      })
    );

    await Promise.all(tipPromises);
    logger.info('Signal tip created and sent to all friends', { 
      senderId, 
      friendCount: friendIds.length,
      ticker: data?.ticker 
    });
  } catch (error) {
    logger.error('Error creating signal tip:', { error });
    throw new Error('Failed to create signal tip.');
  }
} 