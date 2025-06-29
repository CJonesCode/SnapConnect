"use strict";
/*
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo } from "expo-server-sdk";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = void 0;
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
/*
// --- DATA CLEANUP: User Deletion Trigger ---
// The following function automatically deletes a user's data from Firestore
// and their files from Cloud Storage when their account is deleted from
// Firebase Authentication. This requires the Blaze plan.

import * as admin from "firebase-admin";

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const logger = functions.logger;

  logger.info(`User ${uid} is being deleted. Cleaning up associated data.`);

  // 1. Delete user's document in Firestore
  const firestorePromise = admin.firestore().collection("users").doc(uid).delete();

  // 2. Delete user's files in Cloud Storage
  // This deletes all files in the user's dedicated folders for tips and signals.
  const bucket = admin.storage().bucket();
  const tipsPromise = bucket.deleteFiles({ prefix: `tips/${uid}` });
  const signalsPromise = bucket.deleteFiles({ prefix: `signals/${uid}` });
  
  try {
    await Promise.all([firestorePromise, tipsPromise, signalsPromise]);
    logger.info(`Successfully cleaned up data for user ${uid}.`);
  } catch (error) {
    logger.error(`Error cleaning up data for user ${uid}:`, { error });
  }
});

*/
/**************************************
 * Firebase Cloud Functions – Index
 *
 * This file initializes the Firebase Admin SDK and defines Cloud Functions
 * used by TheMarketIndex app. All functions are written in a modular,
 * easily extensible style so that new cleanup tasks can be added with
 * minimal effort.
 **************************************/
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();
/*************************************************
 * Utility: deleteQueryBatch
 * Recursively deletes documents returned by a query
 * in batches to avoid exceeding Firestore limits.
 *************************************************/
async function deleteQueryBatch(query, batchSize = 100) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty)
        return;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // Recurse until the query is empty.
    await deleteQueryBatch(query, batchSize);
}
/*************************************************
 * Cloud Function: onUserDelete
 * Triggered when a Firebase Auth user is deleted.
 * Performs a best-effort cleanup of all data that is
 * either owned by or directly references the user.
 *
 * NOTE: Deploying Cloud Functions requires the Blaze
 *       (pay-as-you-go) plan even if usage is within
 *       the free tier.
 *************************************************/
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    const { uid } = user;
    const logger = functions.logger;
    logger.info(`Starting cleanup for user ${uid}`);
    // 1. Delete the user's main profile document.
    const deleteProfile = db.collection('users').doc(uid).delete();
    // 2. Remove the user from other users' friends lists.
    const removeFromFriends = (async () => {
        const friendsSnap = await db
            .collection('users')
            .where('friends', 'array-contains', uid)
            .get();
        if (friendsSnap.empty)
            return;
        const batch = db.batch();
        friendsSnap.forEach((doc) => {
            batch.update(doc.ref, {
                friends: admin.firestore.FieldValue.arrayRemove(uid),
            });
        });
        await batch.commit();
    })();
    // 3. Delete any friendship documents that reference the user.
    const deleteFriendships = deleteQueryBatch(db.collection('friendships').where('members', 'array-contains', uid));
    // 4. Remove the user from groups or delete orphaned groups.
    const cleanGroups = (async () => {
        const groupsSnap = await db
            .collection('groups')
            .where('members', 'array-contains', uid)
            .get();
        if (groupsSnap.empty)
            return;
        const batch = db.batch();
        groupsSnap.forEach((doc) => {
            const data = doc.data();
            const members = data.members || [];
            const updatedMembers = members.filter((m) => m !== uid);
            if (updatedMembers.length === 0) {
                // No members left – delete entire group.
                batch.delete(doc.ref);
            }
            else {
                batch.update(doc.ref, { members: updatedMembers });
            }
        });
        await batch.commit();
    })();
    // 5. Delete tips sent or received by the user.
    const deleteSentTips = deleteQueryBatch(db.collection('tips').where('senderId', '==', uid));
    const deleteReceivedTips = deleteQueryBatch(db.collection('tips').where('recipientId', '==', uid));
    // 6. Delete the user's signals.
    const deleteSignals = deleteQueryBatch(db.collection('signals').where('userId', '==', uid));
    // 7. Delete all user-owned files from Cloud Storage.
    const deleteStorage = Promise.all([
        bucket.deleteFiles({ prefix: `tips/${uid}` }),
        bucket.deleteFiles({ prefix: `signals/${uid}` }),
    ]);
    // Execute all cleanup tasks in parallel.
    try {
        await Promise.all([
            deleteProfile,
            removeFromFriends,
            deleteFriendships,
            cleanGroups,
            deleteSentTips,
            deleteReceivedTips,
            deleteSignals,
            deleteStorage,
        ]);
        logger.info(`Cleanup completed successfully for user ${uid}`);
    }
    catch (error) {
        logger.error(`Error during cleanup for user ${uid}`, error);
    }
});
/*************************************************
 * Future Functions
 *
 * Additional Cloud Functions (e.g., push notifications,
 * scheduled cleanup of expired tips/signals) should be
 * implemented below. Maintain the modular style shown
 * above to keep the codebase easy to navigate.
 *************************************************/ 
//# sourceMappingURL=index.js.map