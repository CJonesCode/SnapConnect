/*
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo } from "expo-server-sdk";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();
*/

/*
// --- PREMIUM REQUIRED: Push Notification Sender ---
// The following Cloud Function sends a push notification when a new snap is
// created. Deploying functions requires the Firebase Blaze (pay-as-you-go) plan.
// To re-enable, uncomment this function and deploy.

export const onSnapCreate = functions.firestore
  .document("snaps/{snapId}")
  .onCreate(async (snap, context) => {
    const snapData = snap.data();
    if (!snapData) {
      functions.logger.error("No data associated with the snap.");
      return;
    }

    const { recipientId, senderId } = snapData;

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
      title: "New Snap!",
      body: `${senderName} sent you a snap.`,
      data: { snapId: context.params.snapId },
    };

    // Send the notification
    try {
      await expo.sendPushNotificationsAsync([message]);
      functions.logger.info("Push notification sent successfully.", {
        recipientId,
        snapId: context.params.snapId,
      });
    } catch (error) {
      functions.logger.error("Error sending push notification:", {
        error,
        recipientId,
      });
    }
  });

*/ 