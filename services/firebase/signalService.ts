/**
 * This service handles all interactions with Firebase related to signals,
 * including uploading media to Storage and creating documents in Firestore.
 */
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { logger } from '../logging/logger';
import { db, storage } from './firebaseConfig';

/**
 * Represents the structure of a Signal document in Firestore.
 */
export interface Signal {
  id: string;
  postedBy: string;
  mediaUrl: string;
  createdAt: any;
  expiresAt: any;
}

/**
 * Uploads a media file to Firebase Storage for a new signal.
 * @param file The media file (as a Blob) to upload.
 * @param userId The ID of the user posting the signal.
 * @returns The public download URL of the uploaded media.
 */
async function uploadSignalMedia(file: Blob, userId: string): Promise<string> {
  const filePath = `signals/${userId}/${Date.now()}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  logger.info(`Signal media uploaded to ${downloadURL}`);
  return downloadURL;
}

/**
 * Creates a new signal by uploading its media and creating a Firestore document.
 * @param file The media file (as a Blob) for the signal.
 * @param userId The ID of the user posting the signal.
 * @returns The download URL of the uploaded media.
 */
export async function createSignal(file: Blob, userId: string): Promise<string> {
  try {
    const mediaUrl = await uploadSignalMedia(file, userId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1); // Expires in 24 hours

    await addDoc(collection(db, 'signals'), {
      postedBy: userId,
      mediaUrl,
      createdAt: serverTimestamp(),
      expiresAt: expiryDate,
    });
    logger.info('Signal document created for user', { userId });
    return mediaUrl;
  } catch (error) {
    logger.error('Error creating signal', { error });
    throw error;
  }
}

/**
 * Fetches all active (non-expired) signals for a given list of friend IDs.
 * @param friendIds An array of user IDs to fetch signals for.
 * @returns A promise that resolves to an array of Signal objects.
 */
export async function getFriendsSignals(friendIds: string[]): Promise<Signal[]> {
  if (!friendIds || friendIds.length === 0) {
    return [];
  }

  try {
    const now = new Date();
    const signalsRef = collection(db, 'signals');
    const q = query(
      signalsRef,
      where('postedBy', 'in', friendIds),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const signals = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Signal));
    logger.info(`Fetched ${signals.length} active signals for ${friendIds.length} friends.`);
    return signals;
  } catch (error) {
    logger.error('Error fetching friends signals', { error });
    throw new Error('Failed to fetch signals.');
  }
} 