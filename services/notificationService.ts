/**
 * Notification Service
 * 
 * Handles push notification registration, token management, and permission requests.
 * Integrates with Firebase for storing push tokens and uses Expo's notification system.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';
import { logger } from './logging/logger';
import Constants from 'expo-constants';

/**
 * Configures basic notification handling for the app, such as how
 * notifications are displayed when the app is in the foreground.
 */
// @ts-ignore - Linter seems to have stale/incorrect types for NotificationBehavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions from the user
 * @returns Promise<boolean> - true if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notification permissions not granted');
      return false;
    }

    // Additional setup for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    logger.info('Notification permissions granted');
    return true;
  } catch (error) {
    logger.error('Error requesting notification permissions', { error });
    return false;
  }
}

/**
 * Gets the Expo push token for this device
 * @returns Promise<string | null> - the push token or null if unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Note: This only works on physical devices with Expo Go or in standalone apps
    let projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    
    // Fallback to EAS project ID from app config
    if (!projectId) {
      projectId = Constants.expoConfig?.extra?.eas?.projectId;
    }
    
    if (!projectId) {
      logger.warn('No project ID found, attempting to get token without project ID');
    }
    
    const tokenRequest = projectId 
      ? { projectId } 
      : {}; // For Expo Go, we can try without project ID
    
    const token = await Notifications.getExpoPushTokenAsync(tokenRequest);
    
    logger.info('Retrieved Expo push token', { token: token.data, projectId });
    return token.data;
  } catch (error) {
    logger.error('Error getting Expo push token', { error });
    
    // If we get an error about missing project ID, provide helpful message
    if (error instanceof Error && error.message.includes('projectId')) {
      logger.error('Push notifications require project ID - check app.config.js extra.eas.projectId');
    }
    
    return null;
  }
}

/**
 * Registers device for push notifications and stores token in user's Firestore document
 * @param userId - The user's UID
 * @returns Promise<boolean> - true if registration successful
 */
export async function registerForPushNotifications(userId: string): Promise<boolean> {
  try {
    // Check if we have permissions
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      return false;
    }

    // Get the push token
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      logger.warn('Could not retrieve push token');
      return false;
    }

    // Store the token in the user's Firestore document
    const userRef = doc(db, 'users', userId);
    
    try {
      await updateDoc(userRef, {
        expoPushToken: pushToken,
      });
      
      logger.info('Successfully registered for push notifications', { userId, pushToken });
      
      // Debug: Verify the token was actually saved
      logger.info('DEBUG: Push token saved to Firestore', { 
        userId, 
        pushToken, 
        field: 'expoPushToken',
        path: `users/${userId}` 
      });
      
      // Additional verification: Try to read it back immediately
      const verifyDoc = await getDoc(userRef);
      const savedToken = verifyDoc.data()?.expoPushToken;
      
      if (savedToken === pushToken) {
        logger.info('VERIFIED: Push token successfully saved and retrieved', { userId, savedToken });
      } else {
        logger.error('VERIFICATION FAILED: Push token not found after save', { 
          userId, 
          expectedToken: pushToken, 
          actualToken: savedToken || 'null' 
        });
        return false;
      }
      
    } catch (firestoreError) {
      logger.error('Failed to save push token to Firestore', { userId, pushToken, firestoreError });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Error registering for push notifications', { userId, error });
    return false;
  }
}

/**
 * Removes push token from user's document (useful for logout)
 * @param userId - The user's UID
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: null,
    });
    logger.info('Push notification token removed', { userId });
  } catch (error) {
    logger.error('Error removing push token', { userId, error });
  }
}

/**
 * Set up notification listeners for when the app receives notifications
 * @param onNotificationReceived - Callback for when notification is received
 * @param onNotificationResponse - Callback for when user taps notification
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Listen for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    logger.info('Notification received while app foregrounded', { 
      title: notification.request.content.title,
      body: notification.request.content.body 
    });
    onNotificationReceived?.(notification);
  });

  // Listen for user interactions with notifications
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    logger.info('User interacted with notification', { 
      actionIdentifier: response.actionIdentifier,
      data: response.notification.request.content.data 
    });
    onNotificationResponse?.(response);
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Shows a local notification immediately (does not require push notification service)
 * @param title - The notification title
 * @param body - The notification body
 * @param data - Optional data to include with the notification
 */
export async function showLocalNotification(
  title: string, 
  body: string, 
  data?: any
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data || {},
      },
      trigger: null, // Show immediately
    });
    
    logger.info('Local notification shown', { title, body, data });
  } catch (error) {
    logger.error('Error showing local notification', { error, title, body });
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use registerForPushNotifications instead
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  logger.warn('registerForPushNotificationsAsync is deprecated, use registerForPushNotifications instead');
  const pushToken = await getExpoPushToken();
  return pushToken;
}
