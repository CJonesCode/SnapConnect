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

// --- FRIEND REQUEST NOTIFICATIONS ---
// Send push notifications for friend request events

export const onFriendRequestCreate = functions.firestore
  .document("friendships/{friendshipId}")
  .onCreate(async (snap, context) => {
    const friendshipData = snap.data();
    if (!friendshipData) {
      functions.logger.error("No data associated with the friendship.");
      return;
    }

    const { requestedBy, members } = friendshipData;
    
    // Find the recipient (the member who didn't send the request)
    const recipientId = members.find((memberId: string) => memberId !== requestedBy);
    
    if (!recipientId) {
      functions.logger.error("Could not determine friend request recipient.");
      return;
    }

    try {
      // Get the recipient's user document to find their push token
      const recipientDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();

      const recipientData = recipientDoc.data();
      
      // Debug: Log what we actually found in the recipient document
      functions.logger.info("DEBUG: Recipient document data - v2", { 
        recipientId, 
        hasData: !!recipientData,
        expoPushToken: recipientData?.expoPushToken || null,
        allFields: recipientData ? Object.keys(recipientData) : [],
        timestamp: new Date().toISOString()
      });
      
      if (!recipientData || !recipientData.expoPushToken) {
        functions.logger.info("Recipient has no push token.", { recipientId });
        return;
      }

      // Get the sender's profile to display their name
      const senderDoc = await admin
        .firestore()
        .collection("users")
        .doc(requestedBy)
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
        title: "New Friend Request!",
        body: `${senderName} sent you a friend request.`,
        data: { 
          type: "friend_request",
          friendshipId: context.params.friendshipId,
          requestedBy 
        },
      };

      // Send the notification
      await expo.sendPushNotificationsAsync([message]);
      functions.logger.info("Friend request notification sent successfully.", {
        recipientId,
        requestedBy,
        friendshipId: context.params.friendshipId,
      });
    } catch (error) {
      functions.logger.error("Error sending friend request notification:", {
        error,
        recipientId,
        requestedBy,
      });
    }
  });

export const onFriendRequestAccept = functions.firestore
  .document("friendships/{friendshipId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    if (!beforeData || !afterData) {
      functions.logger.error("No data associated with the friendship update.");
      return;
    }

    // Check if status changed from 'pending' to 'accepted'
    if (beforeData.status === 'pending' && afterData.status === 'accepted') {
      const { requestedBy, members } = afterData;
      
      try {
        // Get the original requester's user document to find their push token
        const requesterDoc = await admin
          .firestore()
          .collection("users")
          .doc(requestedBy)
          .get();

        const requesterData = requesterDoc.data();
        
        // Debug: Log what we actually found in the requester document
        functions.logger.info("DEBUG: Requester document data - v2", { 
          requestedBy, 
          hasData: !!requesterData,
          expoPushToken: requesterData?.expoPushToken || null,
          allFields: requesterData ? Object.keys(requesterData) : [],
          timestamp: new Date().toISOString()
        });
        
        if (!requesterData || !requesterData.expoPushToken) {
          functions.logger.info("Requester has no push token.", { requestedBy });
          return;
        }

        // Find the accepter (the member who didn't send the original request)
        const accepterId = members.find((memberId: string) => memberId !== requestedBy);
        
        if (!accepterId) {
          functions.logger.error("Could not determine who accepted the request.");
          return;
        }

        // Get the accepter's profile to display their name
        const accepterDoc = await admin
          .firestore()
          .collection("users")
          .doc(accepterId)
          .get();
        
        const accepterName = accepterDoc.data()?.displayName || "Someone";
        const token = requesterData.expoPushToken;

        // Check if the token is a valid Expo push token
        if (!Expo.isExpoPushToken(token)) {
          functions.logger.error("Invalid Expo push token:", { token });
          return;
        }

        // Construct the notification message
        const message = {
          to: token,
          sound: "default" as const,
          title: "Friend Request Accepted!",
          body: `${accepterName} accepted your friend request.`,
          data: { 
            type: "friend_accepted",
            friendshipId: context.params.friendshipId,
            acceptedBy: accepterId 
          },
        };

        // Send the notification
        await expo.sendPushNotificationsAsync([message]);
        functions.logger.info("Friend acceptance notification sent successfully.", {
          requestedBy,
          acceptedBy: accepterId,
          friendshipId: context.params.friendshipId,
        });
      } catch (error) {
        functions.logger.error("Error sending friend acceptance notification:", {
          error,
          requestedBy,
        });
      }
    }
  });

// --- EPHEMERAL DATA CLEANUP ---
// Clean up media files when tip documents are deleted

export const onTipDelete = functions.firestore
  .document("tips/{tipId}")
  .onDelete(async (snap, context) => {
    const tipData = snap.data();
    if (!tipData || !tipData.mediaUrl) {
      functions.logger.warn("Deleted tip had no media URL to clean up.", { 
        tipId: context.params.tipId 
      });
      return;
    }

    try {
      // Extract the file path from the Firebase Storage URL
      const mediaUrl = tipData.mediaUrl as string;
      
      // Parse the Firebase Storage URL to get the file path
      // URLs typically look like: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
      const urlParts = mediaUrl.split('/o/');
      if (urlParts.length < 2) {
        functions.logger.error("Could not parse media URL for cleanup", { mediaUrl });
        return;
      }
      
      // Decode the file path (URL encoded)
      const encodedPath = urlParts[1].split('?')[0]; // Remove query parameters
      const filePath = decodeURIComponent(encodedPath);
      
      // Delete the file from Storage
      const bucket = admin.storage().bucket();
      await bucket.file(filePath).delete();
      
      functions.logger.info("Successfully cleaned up media file for deleted tip", {
        tipId: context.params.tipId,
        filePath,
        senderId: tipData.senderId,
        recipientId: tipData.recipientId
      });
      
    } catch (error) {
      functions.logger.error("Error cleaning up media file for deleted tip", {
        error,
        tipId: context.params.tipId,
        mediaUrl: tipData.mediaUrl
      });
    }
  });

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

// --- TEST NOTIFICATION FUNCTION ---
// Simple HTTP function to send a test notification to Charlie
export const sendTestNotification = functions.https.onRequest(async (req, res) => {
  try {
    // Charlie's known push token
    const charlieToken = "ExponentPushToken[1TtdpfBpzTosqrs5IVCWME]";
    
    // Check if the token is valid
    if (!Expo.isExpoPushToken(charlieToken)) {
      throw new Error("Invalid push token");
    }

    // Create test message
    const message = {
      to: charlieToken,
      sound: "default" as const,
      title: "Test Notification! 🚀",
      body: "Push notifications are working perfectly!",
      data: { 
        type: "test",
        timestamp: new Date().toISOString()
      },
    };

    // Send the notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    
    functions.logger.info("Test notification sent successfully", {
      token: charlieToken,
      ticket: ticket[0]
    });

    res.status(200).json({ 
      success: true, 
      message: "Test notification sent to Charlie!",
      ticket: ticket[0]
    });
    
  } catch (error) {
    functions.logger.error("Error sending test notification", { error });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
