/**
 * CameraScreen component - Main camera interface using modular components.
 * 
 * This component serves as the main camera interface using modular
 * TopBar, ShutterBar, and PreviewScreen components for better organization
 * and maintainability.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { 
  CameraView, 
  useCameraPermissions, 
  useMicrophonePermissions,
  PermissionStatus 
} from 'expo-camera';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { 
  Button, 
  Text, 
  useTheme, 
  ActivityIndicator 
} from 'react-native-paper';
import { useCameraStore } from '@/hooks/useCameraStore';
import { logger } from '@/services/logging/logger';
import TopBar from './TopBar';
import ShutterBar from './ShutterBar';

/**
 * CameraScreen renders the main camera interface with modular components.
 *
 * @returns The rendered CameraScreen component
 */
export default function CameraScreen() {
  // Removed excessive render logging

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isNavReady, setIsNavReady] = useState(false);
  
  const { 
    facing, 
    flash, 
    isRecording,
    resetMedia 
  } = useCameraStore();
  
  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const isFocused = useIsFocused();
  
  const isCameraActive = isNavReady && isFocused && cameraPermission?.status === PermissionStatus.GRANTED;
  const controlsDisabled = !cameraReady; // Don't disable during recording - need stop button!

  // For video recording, we need both camera and microphone permissions
  const hasAllPermissions = cameraPermission?.status === PermissionStatus.GRANTED && 
                           microphonePermission?.status === PermissionStatus.GRANTED;

  // Note: Media reset is handled by the modal when it closes,
  // so we don't need to reset here to avoid conflicts during navigation

  // Automatically request permissions on first mount only
  useEffect(() => {
    if (!cameraPermission || cameraPermission.status === PermissionStatus.UNDETERMINED) {
      logger.info('Camera: Requesting camera permission');
      requestCameraPermission();
    }
    if (!microphonePermission || microphonePermission.status === PermissionStatus.UNDETERMINED) {
      logger.info('Camera: Requesting microphone permission');
      requestMicrophonePermission();
    }
  }, []); // Remove dependencies to prevent re-requests

  // Set navigation ready state based on focus (don't reset camera ready)
  useEffect(() => {
    if (isFocused) {
      setIsNavReady(true);
    } else {
      setIsNavReady(false);
      // If we lose focus while recording, stop recording to prevent issues
      if (isRecording && cameraRef.current) {
        logger.info('Camera: Stopping recording - screen unfocused');
        cameraRef.current.stopRecording();
      }
    }
  }, [isFocused, isRecording]);

  /**
   * Handles manual permission request when user clicks the button.
   */
  function handleRequestPermission(): void {
    logger.info('handleRequestPermission: Requesting camera and microphone permissions...');
    requestCameraPermission();
    requestMicrophonePermission();
  }

  // Loading state
  if (!cameraPermission || !microphonePermission) {
    return <ActivityIndicator animating={true} style={styles.fullScreen} />;
  }

  // Waiting for permission resolution
  if (cameraPermission.status === PermissionStatus.UNDETERMINED || 
      microphonePermission.status === PermissionStatus.UNDETERMINED) {
    return (
      <View style={[
        styles.permissionContainer,
        { backgroundColor: theme.colors.background },
      ]}>
        <ActivityIndicator animating={true} />
        <Text
          variant="bodyMedium"
          style={{ 
            color: theme.colors.onBackground, 
            marginTop: 16 
          }}
        >
          Requesting permissions…
        </Text>
      </View>
    );
  }

  // Permission denied state
  if (cameraPermission.status === PermissionStatus.DENIED || 
      microphonePermission.status === PermissionStatus.DENIED) {
    return (
      <View style={[
        styles.permissionContainer,
        { backgroundColor: theme.colors.background },
      ]}>
        <Text
          variant="titleLarge"
          style={{ 
            color: theme.colors.onBackground, 
            textAlign: 'center' 
          }}
        >
          Camera or microphone access denied.
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onBackground,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          To use the camera and record videos, you need to enable both camera
          and microphone permissions in your phone's settings.
        </Text>
        <Button
          mode="contained"
          onPress={() => Linking.openSettings()}
          style={styles.permissionButton}
        >
          Open Settings
        </Button>
      </View>
    );
  }

  // Main camera interface
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
        active={isCameraActive}
        mode="video"
        videoQuality={Platform.OS === 'android' ? '480p' : '720p'}
        onCameraReady={() => {
          logger.info('Camera: Ready');
          // Add a small delay to ensure camera is fully ready
          setTimeout(() => {
            setCameraReady(true);
          }, 500);
        }}
        onMountError={(e) =>
          logger.error('Camera mount error', { message: e.message })
        }
      />
      <TopBar disabled={controlsDisabled} />
      <ShutterBar 
        cameraRef={cameraRef} 
        disabled={controlsDisabled}
        hasAllPermissions={hasAllPermissions}
        cameraReady={cameraReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionButton: {
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
}); 