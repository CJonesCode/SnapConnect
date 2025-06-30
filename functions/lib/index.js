"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = exports.onFriendRequestAccept = exports.onFriendRequestCreate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const expo_server_sdk_1 = require("expo-server-sdk");
// Initialize Firebase Admin SDK
admin.initializeApp();
// Initialize Expo SDK
const expo = new expo_server_sdk_1.Expo();
// --- PUSH NOTIFICATION FUNCTIONS ---
/**
 * Helper function to send a push notification to a user.
 * @param recipientId The UID of the notification recipient.
 * @param title The notification title.
 * @param body The notification body text.
 * @param data Optional data payload for the notification.
 */
async function sendNotificationToUser(recipientId, title, body, data) {
    const logger = functions.logger;
    try {
        // Get the recipient's user document to find their push token
        const recipientDoc = await admin
            .firestore()
            .collection("users")
            .doc(recipientId)
            .get();
        const recipientData = recipientDoc.data();
        if (!recipientData || !recipientData.pushToken) {
            logger.info("Recipient has no push token.", { recipientId });
            return;
        }
        const token = recipientData.pushToken;
        // Check if the token is a valid Expo push token
        if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
            logger.error("Invalid Expo push token:", { token, recipientId });
            return;
        }
        // Construct the notification message
        const message = {
            to: token,
            sound: "default",
            title,
            body,
            data: data || {},
        };
        // Send the notification
        await expo.sendPushNotificationsAsync([message]);
        logger.info("Push notification sent successfully.", {
            recipientId,
            title,
        });
    }
    catch (error) {
        logger.error("Error sending push notification:", {
            error,
            recipientId,
            title,
        });
    }
}
/**
 * Sends a notification when a new friend request is received.
 */
exports.onFriendRequestCreate = functions.firestore
    .document("friendships/{friendshipId}")
    .onCreate(async (snapshot, context) => {
    var _a;
    const friendshipData = snapshot.data();
    if (!friendshipData || friendshipData.status !== "pending") {
        return;
    }
    const { members, requestedBy } = friendshipData;
    const recipientId = members.find((uid) => uid !== requestedBy);
    if (!recipientId) {
        functions.logger.error("Could not determine recipient for friend request.");
        return;
    }
    // Get the sender's profile to display their name
    const senderDoc = await admin
        .firestore()
        .collection("users")
        .doc(requestedBy)
        .get();
    const senderName = ((_a = senderDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || "Someone";
    await sendNotificationToUser(recipientId, "New Friend Request", `${senderName} sent you a friend request`, {
        type: "friend_request",
        friendshipId: context.params.friendshipId,
        senderId: requestedBy,
    });
});
/**
 * Sends a notification when a friend request is accepted.
 */
exports.onFriendRequestAccept = functions.firestore
    .document("friendships/{friendshipId}")
    .onUpdate(async (change, context) => {
    var _a;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    // Check if the status changed from pending to accepted
    if (beforeData.status !== "pending" || afterData.status !== "accepted") {
        return;
    }
    const { members, requestedBy } = afterData;
    const accepterId = members.find((uid) => uid !== requestedBy);
    if (!accepterId) {
        functions.logger.error("Could not determine accepter for friend request.");
        return;
    }
    // Get the accepter's profile to display their name
    const accepterDoc = await admin
        .firestore()
        .collection("users")
        .doc(accepterId)
        .get();
    const accepterName = ((_a = accepterDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || "Someone";
    // Notify the original requester that their request was accepted
    await sendNotificationToUser(requestedBy, "Friend Request Accepted", `${accepterName} accepted your friend request`, {
        type: "friend_request_accepted",
        friendshipId: context.params.friendshipId,
        accepterId: accepterId,
    });
});
// --- DATA CLEANUP: User Deletion Trigger ---
// The following function automatically deletes a user's data from Firestore
// and their files from Cloud Storage when their account is deleted from
// Firebase Authentication. This requires the Blaze plan.
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
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
        const username = userData === null || userData === void 0 ? void 0 : userData.username;
        // 1. Delete user's document from 'users'
        const userDeletePromise = userDocRef.delete();
        // 2. Delete username from 'usernames'
        let usernameDeletePromise = Promise.resolve();
        if (username) {
            usernameDeletePromise = admin.firestore().collection("usernames").doc(username).delete();
        }
        // 3. Delete user's files in Cloud Storage
        const bucket = admin.storage().bucket();
        const tipsPromise = bucket.deleteFiles({ prefix: `tips/${uid}` });
        const signalsPromise = bucket.deleteFiles({ prefix: `signals/${uid}` });
        await Promise.all([userDeletePromise, usernameDeletePromise, tipsPromise, signalsPromise]);
        logger.info(`Successfully cleaned up all data for user ${uid}.`);
    }
    catch (error) {
        logger.error(`Error cleaning up data for user ${uid}:`, { error });
    }
});
//# sourceMappingURL=index.js.map