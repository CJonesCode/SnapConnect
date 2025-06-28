/**
 * This service handles all interactions with Firebase related to stories,
 * including uploading media to Storage and creating documents in Firestore.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db, storage } from './firebaseConfig';

/**
 * Represents the structure of a Story document in Firestore.
 */
export type Story = {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: any; // Firestore ServerTimestamp
  expiresAt: any; // Firestore ServerTimestamp
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
 * Creates a new story by uploading its media and creating a Firestore document.
 * @param localUri - The local URI of the story's media.
 * @param userId - The UID of the user posting the story.
 */
export async function createStory(localUri: string, userId: string): Promise<void> {
  try {
    // 1. Upload media to Firebase Storage
    const uploadPath = `stories/${userId}/${Date.now()}`;
    const downloadURL = await uploadMedia(localUri, uploadPath);

    // 2. Create story document in Firestore
    const storiesCollection = collection(db, 'stories');
    const now = Date.now();
    const expires = new Date(now + 24 * 60 * 60 * 1000); // 24 hours from now

    await addDoc(storiesCollection, {
      userId,
      mediaUrl: downloadURL,
      mediaType: 'image', // For now, defaulting to image
      createdAt: serverTimestamp(),
      expiresAt: expires,
    });
  } catch (error) {
    console.error('Error creating story:', error);
    throw new Error('Failed to create story.');
  }
}

/**
 * Listens for active (non-expired) stories from a given list of user IDs.
 * The stories are returned grouped by the user who posted them.
 *
 * @param friendIds The list of user UIDs to fetch stories from.
 * @param onUpdate Callback function that receives the stories, grouped by user ID.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToStories(
  friendIds: string[],
  onUpdate: (stories: Record < string, Story[] > ) => void
): () => void {
  if (friendIds.length === 0) {
    onUpdate({});
    return () => {}; // Return a no-op unsubscribe function
  }

  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    where('userId', 'in', friendIds),
    where('expiresAt', '>', new Date())
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      // Note: It's safer to build the object field by field to avoid issues
      // if Firestore data doesn't perfectly match the type.
      const data = doc.data();
      stories.push({
        id: doc.id,
        userId: data.userId,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      });
    });

    // Group stories by userId
    const grouped = stories.reduce((acc, story) => {
      (acc[story.userId] = acc[story.userId] || []).push(story);
      return acc;
    }, {} as Record < string, Story[] > );

    onUpdate(grouped);
  });

  return unsubscribe;
} 