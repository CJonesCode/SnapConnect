/**
 * NotificationManager Component
 * 
 * Handles notification listeners and responses throughout the app.
 * Sets up listeners for incoming notifications and handles user interactions.
 */
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { setupNotificationListeners } from '@/services/notificationService';
import { logger } from '@/services/logging/logger';
import { Alert } from 'react-native';

/**
 * NotificationManager component that should be rendered in the app layout
 * to handle notifications globally.
 */
export function NotificationManager() {
  const router = useRouter();

  useEffect(() => {
    // Set up notification listeners
    const cleanup = setupNotificationListeners(
      // Handle notification received while app is in foreground
      (notification) => {
        const { title, body, data } = notification.request.content;
        
        // Show an alert for foreground notifications
        Alert.alert(
          title || 'Notification',
          body || 'You received a notification',
          [
            {
              text: 'Dismiss',
              style: 'cancel'
            },
            {
              text: 'View',
              onPress: () => handleNotificationResponse(data)
            }
          ]
        );
      },
      
      // Handle user tapping on notification
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationResponse(data);
      }
    );

    return cleanup;
  }, [router]);

  /**
   * Handle notification response by navigating to appropriate screen
   */
  const handleNotificationResponse = (data: any) => {
    if (!data) return;

    try {
      switch (data.type) {
        case 'friend_request':
          // Navigate to friends screen where user can see and respond to requests
          router.push('/(tabs)/friends');
          break;
          
        case 'friend_accepted':
          // Navigate to friends screen to see updated friends list
          router.push('/(tabs)/friends');
          break;
          
        default:
          logger.info('Unknown notification type', { type: data.type });
          break;
      }
    } catch (error) {
      logger.error('Error handling notification response', { error, data });
    }
  };

  // This component doesn't render anything visible
  return null;
} 