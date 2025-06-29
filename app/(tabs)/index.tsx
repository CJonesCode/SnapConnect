/**
 * This screen serves as the main camera interface for the application.
 * It uses `expo-camera` to request permissions and display a real-time camera preview,
 * ensuring compatibility with the Expo Go app.
 */
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  PermissionStatus,
} from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { logger } from '../../services/logging/logger';

export default function CameraScreen() {
  logger.info('--- CameraScreen: Component rendering ---');

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const theme = useTheme();
  const isCameraActive = permission?.status === PermissionStatus.GRANTED;

  logger.info(`Permission status: ${permission?.status}`);

  // Automatically request permission on first mount (when permission is null)
  // or when it is explicitly undetermined.
  useEffect(() => {
    if (!permission || permission.status === PermissionStatus.UNDETERMINED) {
      logger.info('Auto requesting camera permission...');
      requestPermission();
    }
  }, [permission, requestPermission]);

  function handleRequestPermission() {
    logger.info('handleRequestPermission: Requesting camera permission...');
    requestPermission();
  }

  if (!permission) {
    logger.info('Render state: Permissions loading');
    return <ActivityIndicator animating={true} style={styles.fullScreen} />;
  }

  if (permission.status === PermissionStatus.UNDETERMINED) {
    logger.info('Render state: Waiting for permission resolution');
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator animating={true} />
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onBackground, marginTop: 16 }}
        >
          Requesting camera permission…
        </Text>
      </View>
    );
  }

  if (permission.status === PermissionStatus.DENIED) {
    logger.info('Render state: Permissions denied');
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onBackground, textAlign: 'center' }}
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

  function toggleCameraFacing() {
    logger.info(`toggleCameraFacing: Current facing: ${facing}. Toggling...`);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    logger.info('takePicture: Attempting to take picture...');
    if (cameraRef.current) {
      logger.info('takePicture: Camera ref is available.');
      try {
        const photo = await cameraRef.current.takePictureAsync();
        logger.info(`takePicture: Success. Photo URI: ${photo.uri}`);
        router.push({
          pathname: '/modal',
          params: { uri: photo.uri },
        });
      } catch (error) {
        logger.error('takePicture: Failed to take picture', { error });
      }
    } else {
      logger.warn('takePicture: Camera ref is not available.');
    }
  }

  logger.info('Render state: Rendering CameraView');
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        active={isCameraActive}
        onCameraReady={() => logger.info('EVENT: onCameraReady fired!')}
        onMountError={(e) =>
          logger.error('Camera mount error', { message: e.message })
        }
      />
      <View style={styles.controlsContainer}>
        <IconButton
          icon="camera-flip"
          iconColor="white"
          size={34}
          onPress={toggleCameraFacing}
          style={styles.flipButton}
        />
        <View style={styles.shutterButtonOuter}>
          <IconButton
            icon="camera"
            iconColor="white"
            size={40}
            onPress={takePicture}
            style={styles.shutterButtonInner}
            disabled={!permission.granted}
          />
        </View>
      </View>
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
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  flipButton: {
    position: 'absolute',
    right: 20,
    bottom: 10,
  },
  shutterButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    margin: 0,
  },
});
