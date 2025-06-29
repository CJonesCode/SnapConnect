import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo } from "expo-server-sdk";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();

/*
// --- PREMIUM REQUIRED: Push Notification Sender ---
// The following Cloud Function sends a push notification when a new tip is
// created. Deploying functions requires the Firebase Blaze (pay-as-you-go) plan.
// To re-enable, uncomment this function and deploy.

export const onTipCreate = functions.firestore
  .document("tips/{tipId}")
  .onCreate(async (tip, context) => {
    const tipData = tip.data();
    if (!tipData) {
      functions.logger.error("No data associated with the tip.");
      return;
    }

    const { recipientId, senderId } = tipData;

    // Get the recipient's user document to find their push token
    const recipientDoc = await admin
      .firestore()
      .collection("users")
      .doc(recipientId)
      .get();

    const recipientData = recipientDoc.data();
    if (!recipientData || !recipientData.expoPushToken) {
      functions.logger.error(
        "Recipient has no push token.",
        { recipientId }
      );
      return;
    }

    // Get the sender's profile to display their name
    const senderDoc = await admin
      .firestore()
      .collection("users")
      .doc(senderId)
      .get();
    
    const senderName = senderDoc.data()?.displayName || "Someone";
    const token = recipientData.expoPushToken;

    // Check if the token is a valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      functions.logger.error("Invalid Expo push token:", { token });
      return;
    }

    // Construct the notification message
    const message = {
      to: token,
      sound: "default" as const,
      title: "New Tip!",
      body: `${senderName} sent you a tip.`,
      data: { tipId: context.params.tipId },
    };

    // Send the notification
    try {
      await expo.sendPushNotificationsAsync([message]);
      functions.logger.info("Push notification sent successfully.", {
        recipientId,
        tipId: context.params.tipId,
      });
    } catch (error) {
      functions.logger.error("Error sending push notification:", {
        error,
        recipientId,
      });
    }
  });

*/

// --- DATA CLEANUP: User Deletion Trigger ---
// The following function automatically deletes a user's data from Firestore
// and their files from Cloud Storage when their account is deleted from
// Firebase Authentication. This requires the Blaze plan.

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const logger = functions.logger;

  logger.info(`User ${uid} is being deleted. Cleaning up associated data.`);

  const userDocRef = admin.firestore().collection("users").doc(uid);

  try {
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();
    
    if (!userData) {
      logger.warn(`No user document found for uid: ${uid}. Cannot clean up username.`);
    }

    const username = userData?.username;
    
    // 1. Delete user's document from 'users'
    const userDeletePromise = userDocRef.delete();

    // 2. Delete username from 'usernames'
    let usernameDeletePromise: Promise<any> = Promise.resolve();
    if (username) {
      usernameDeletePromise = admin.firestore().collection("usernames").doc(username).delete();
    }

    // 3. Delete user's files in Cloud Storage
    const bucket = admin.storage().bucket();
    const tipsPromise = bucket.deleteFiles({ prefix: `tips/${uid}` });
    const signalsPromise = bucket.deleteFiles({ prefix: `signals/${uid}` });
    
    await Promise.all([userDeletePromise, usernameDeletePromise, tipsPromise, signalsPromise]);
    logger.info(`Successfully cleaned up all data for user ${uid}.`);
  } catch (error) {
    logger.error(`Error cleaning up data for user ${uid}:`, { error });
  }
});
