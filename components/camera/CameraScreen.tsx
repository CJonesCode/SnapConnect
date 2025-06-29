/**
 * CameraScreen component - Main camera interface using modular components.
 * 
 * This component serves as the main camera interface using modular
 * TopBar, ShutterBar, and PreviewScreen components for better organization
 * and maintainability.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { 
  CameraView, 
  useCameraPermissions, 
  PermissionStatus 
} from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
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
import PreviewScreen from './PreviewScreen';

/**
 * CameraScreen renders the main camera interface with modular components.
 *
 * @returns The rendered CameraScreen component
 */
export default function CameraScreen() {
  logger.info('--- CameraScreen: Component rendering ---');

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isNavReady, setIsNavReady] = useState(false);
  
  const { 
    facing, 
    flash, 
    showPreview, 
    isRecording 
  } = useCameraStore();
  
  const cameraRef = useRef<CameraView>(null);
  const theme = useTheme();
  const isFocused = useIsFocused();
  
  const isCameraActive = isNavReady && isFocused && permission?.status === PermissionStatus.GRANTED;
  const controlsDisabled = !cameraReady || isRecording;

  logger.info(`Permission status: ${permission?.status}`);

  // Automatically request permission on first mount
  useEffect(() => {
    if (!permission || permission.status === PermissionStatus.UNDETERMINED) {
      logger.info('Auto requesting camera permission...');
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Delay camera rendering until navigation is ready
  useEffect(() => {
    setIsNavReady(true);
  }, []);

  /**
   * Handles manual permission request when user clicks the button.
   */
  function handleRequestPermission(): void {
    logger.info('handleRequestPermission: Requesting camera permission...');
    requestPermission();
  }

  // Show preview screen if media was captured
  if (showPreview) {
    return <PreviewScreen />;
  }

  // Loading state
  if (!permission) {
    logger.info('Render state: Permissions loading');
    return <ActivityIndicator animating={true} style={styles.fullScreen} />;
  }

  // Waiting for permission resolution
  if (permission.status === PermissionStatus.UNDETERMINED) {
    logger.info('Render state: Waiting for permission resolution');
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
          Requesting camera permission…
        </Text>
      </View>
    );
  }

  // Permission denied state
  if (permission.status === PermissionStatus.DENIED) {
    logger.info('Render state: Permissions denied');
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
          You have denied camera access.
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onBackground,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          To use the camera, you need to enable permission in your phone's
          settings.
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
  logger.info('Render state: Rendering CameraView');
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
        active={isCameraActive}
        onCameraReady={() => {
          logger.info('EVENT: onCameraReady fired!');
          setCameraReady(true);
        }}
        onMountError={(e) =>
          logger.error('Camera mount error', { message: e.message })
        }
      />
      <TopBar disabled={controlsDisabled} />
      <ShutterBar cameraRef={cameraRef} disabled={controlsDisabled} />
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