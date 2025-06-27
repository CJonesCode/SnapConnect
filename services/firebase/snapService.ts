/**
 * This service handles all interactions with Firebase related to snaps,
 * including uploading media to Storage and creating documents in Firestore.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from './firebaseConfig';

/**
 * Represents the structure of a Snap document in Firestore.
 */
type Snap = {
  senderId: string;
  recipientId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  viewed: boolean;
  createdAt: number;
  expiresAt: number;
};

/**
 * Uploads a media file to Firebase Storage and returns the download URL.
 * @param uri - The local URI of the media file.
 * @param path - The path in Firebase Storage to upload to.
 * @returns The public URL of the uploaded file.
 */
async function uploadMedia(uri: string, path: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Sends a snap by uploading its media and creating a Firestore document.
 * @param localUri - The local URI of the snap's media.
 * @param senderId - The UID of the user sending the snap.
 * @param recipientId - The UID of the user receiving the snap.
 */
export async function sendSnap(localUri: string, senderId: string, recipientId: string): Promise<void> {
  try {
    // 1. Upload media to Firebase Storage
    const uploadPath = `snaps/${senderId}/${Date.now()}`;
    const downloadURL = await uploadMedia(localUri, uploadPath);

    // 2. Create snap document in Firestore
    const snapData: Omit<Snap, 'createdAt'> = {
      senderId,
      recipientId,
      mediaUrl: downloadURL,
      mediaType: 'image',
      viewed: false,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
    };

    await addDoc(collection(db, 'snaps'), {
      ...snapData,
      createdAt: Date.now(),
    });

    console.log('Snap sent successfully!');
  } catch (error) {
    console.error('Error sending snap:', error);
    throw error;
  }
} 