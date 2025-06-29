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
import { useIsFocused } from '@react-navigation/native';
import {
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { logger } from '../../services/logging/logger';
import { useCameraStore } from '@/hooks/useCameraStore';

export default function CameraScreen() {
  logger.info('--- CameraScreen: Component rendering ---');

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isNavReady, setIsNavReady] = useState(false);
  const {
    facing,
    toggleFacing,
    flash,
    toggleFlash,
    isRecording,
    setIsRecording,
    setPhotoUri,
    setVideoUri,
  } = useCameraStore();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const theme = useTheme();
  const isFocused = useIsFocused();
  const isCameraActive = isNavReady && isFocused && permission?.status === PermissionStatus.GRANTED;
  const controlsDisabled = !cameraReady || isRecording;

  logger.info(`Permission status: ${permission?.status}`);

  // Automatically request permission on first mount (when permission is null)
  // or when it is explicitly undetermined.
  useEffect(() => {
    if (!permission || permission.status === PermissionStatus.UNDETERMINED) {
      logger.info('Auto requesting camera permission...');
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Add this effect to delay camera rendering
  useEffect(() => {
    // This runs after the initial render, ensuring navigation is ready.
    setIsNavReady(true);
  }, []);

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

  async function takePicture() {
    if (isRecording) return;
    logger.info('takePicture: Attempting to take picture...');
    if (cameraRef.current) {
      logger.info('takePicture: Camera ref is available.');
      try {
        const photo = await cameraRef.current.takePictureAsync();
        logger.info(`takePicture: Success. Photo URI: ${photo.uri}`);
        setPhotoUri(photo.uri);
        router.push({
          pathname: '/modal',
          params: { uri: photo.uri, type: 'photo' },
        });
      } catch (error) {
        logger.error('takePicture: Failed to take picture', { error });
      }
    } else {
      logger.warn('takePicture: Camera ref is not available.');
    }
  }

  async function recordVideo() {
    logger.info('recordVideo: Long press detected, starting recording...');
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        if (video) {
          logger.info(`recordVideo: Success. Video URI: ${video.uri}`);
          setVideoUri(video.uri);
          router.push({
            pathname: '/modal',
            params: { uri: video.uri, type: 'video' },
          });
        } else {
          logger.warn('recordVideo: Recording returned no video object.');
        }
      } catch (error) {
        logger.error('recordVideo: Failed to record video', { error });
      } finally {
        setIsRecording(false);
      }
    } else {
      logger.warn('recordVideo: Camera ref is not available.');
    }
  }

  function stopVideoRecording() {
    logger.info('stopVideoRecording: Press out detected, stopping recording...');
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }

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
      <View style={styles.topBar}>
        <IconButton
          icon={flash === 'on' ? 'flash' : 'flash-off'}
          iconColor="white"
          size={28}
          onPress={toggleFlash}
          disabled={controlsDisabled}
        />
        <IconButton
          icon="camera-flip"
          iconColor="white"
          size={28}
          onPress={toggleFacing}
          disabled={controlsDisabled}
        />
      </View>
      <View style={styles.bottomBar}>
        <View
          style={[
            styles.shutterButtonOuter,
            isRecording && styles.shutterButtonRecording,
          ]}
        >
          <IconButton
            icon="camera"
            iconColor="white"
            size={40}
            onPress={takePicture}
            onLongPress={recordVideo}
            onPressOut={stopVideoRecording}
            style={styles.shutterButtonInner}
            disabled={controlsDisabled}
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
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  shutterButtonRecording: {
    borderColor: 'red',
    backgroundColor: 'red',
  },
  shutterButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    margin: 0,
  },
});
