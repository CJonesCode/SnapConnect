/**
 * AuthAwareCamera Component
 * 
 * Wrapper around CameraScreen that ensures camera initialization only happens
 * when the user is properly authenticated. This prevents camera permission
 * issues on iOS when auth state changes.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { CameraScreen } from '@/components/camera';
import { logger } from '@/services/logging/logger';

/**
 * AuthAwareCamera only renders the camera when user is authenticated and initialized.
 * This prevents premature camera initialization during auth flow.
 */
export function AuthAwareCamera() {
  const { user, isInitialized } = useAuth();
  const theme = useTheme();

  // Still initializing auth state
  if (!isInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
        <Text variant="bodyMedium" style={{ 
          color: theme.colors.onBackground, 
          marginTop: 16,
          textAlign: 'center'
        }}>
          Initializing...
        </Text>
      </View>
    );
  }

  // User not authenticated - this shouldn't happen due to AuthGuard, 
  // but adding as safety net
  if (!user) {
    logger.warn('AuthAwareCamera: User not authenticated');
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyMedium" style={{ 
          color: theme.colors.onBackground,
          textAlign: 'center'
        }}>
          Authentication required
        </Text>
      </View>
    );
  }

  // User is authenticated and auth is initialized - safe to render camera
  return <CameraScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 