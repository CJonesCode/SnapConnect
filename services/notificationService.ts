/**
 * This service handles all push notification-related logic,
 * such as registering for tokens and configuring permissions.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configures basic notification handling for the app, such as how
 * notifications are displayed when the app is in the foreground.
 */
// @ts-ignore - Linter seems to have stale/incorrect types for NotificationBehavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device for push notifications and returns the Expo Push Token.
 * This function will request notification permissions from the user.
 *
 * @returns The ExpoPushToken string, or null if permissions are denied or an error occurs.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  // TODO: Use the new getExpoPushTokenAsync method with a projectId
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Expo Push Token:', token);

  return token;
}
