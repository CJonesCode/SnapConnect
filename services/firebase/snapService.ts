/**
 * This service handles all interactions with Firebase related to snaps,
 * including uploading media to Storage and creating documents in Firestore.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db, storage } from './firebaseConfig';

/**
 * Represents the structure of a Snap document in Firestore.
 */
export type Snap = {
  senderId: string;
  senderDisplayName: string;
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
    // 1. Get sender's display name
    const userRef = doc(db, 'users', senderId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('Could not find user profile to send snap.');
    }
    const senderDisplayName = userSnap.data().displayName || 'Someone';
    
    // 2. Upload media to Firebase Storage
    const uploadPath = `snaps/${senderId}/${Date.now()}`;
    const downloadURL = await uploadMedia(localUri, uploadPath);

    // 3. Create snap document in Firestore
    const snapData = {
      senderId,
      senderDisplayName,
      recipientId,
      mediaUrl: downloadURL,
      mediaType: 'image', // Assuming image for now
      viewed: false,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    };

    await addDoc(collection(db, 'snaps'), snapData);

    console.log('Snap sent successfully!');
  } catch (error) {
    console.error('Error sending snap:', error);
    throw error;
  }
}

/**
 * Marks a specific snap as viewed in Firestore.
 * @param snapId The ID of the snap document to update.
 */
export async function markSnapAsViewed(snapId: string): Promise<void> {
  const snapRef = doc(db, 'snaps', snapId);
  try {
    await updateDoc(snapRef, { viewed: true });
  } catch (error) {
    console.error('Error marking snap as viewed:', error);
    // Non-critical, so we don't re-throw
  }
}

/**
 * Listens for real-time updates to incoming, non-expired snaps for a specific user.
 * @param userId The UID of the user receiving the snaps.
 * @param onUpdate A callback function that receives the updated list of snaps.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToSnaps(
  userId: string,
  onUpdate: (snaps: (Snap & { id: string })[]) => void
): () => void {
  const snapsRef = collection(db, 'snaps');
  const q = query(
    snapsRef,
    where('recipientId', '==', userId),
    where('expiresAt', '>', new Date()),
    orderBy('expiresAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const snaps: (Snap & { id: string })[] = [];
      querySnapshot.forEach((doc) => {
        snaps.push({
          id: doc.id,
          ...doc.data(),
        } as Snap & { id: string });
      });
      onUpdate(snaps);
    },
    (error) => {
      console.error('Error listening to snaps:', error);
      onUpdate([]);
    }
  );

  return unsubscribe;
} 