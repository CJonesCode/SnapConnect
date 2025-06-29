/**
 * ShutterBar component for camera capture controls.
 * 
 * Simple gesture-based interface:
 * - Tap: Take photo
 * - Long press: Record video
 * - Tap while recording: Stop recording
 */
import React, { RefObject } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCameraStore } from '@/hooks/useCameraStore';
import { logger } from '@/services/logging/logger';

interface ShutterBarProps {
  cameraRef: RefObject<CameraView | null>;
  disabled?: boolean;
  hasAllPermissions?: boolean;
}

/**
 * ShutterBar renders the capture controls at the bottom of the camera screen.
 *
 * @param {ShutterBarProps} props - Component props
 * @returns The rendered ShutterBar component
 */
export default function ShutterBar({ 
  cameraRef, 
  disabled = false, 
  hasAllPermissions = true 
}: ShutterBarProps) {
  const router = useRouter();
  const { 
    isRecording, 
    setIsRecording, 
    setPhotoUri, 
    setVideoUri 
  } = useCameraStore();

  /**
   * Handles taking a photo when the shutter button is pressed.
   */
  async function takePicture(): Promise<void> {
    if (isRecording || disabled) return;
    
    logger.info('takePicture: Attempting to take picture...');
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        logger.info(`takePicture: Success. Photo URI: ${photo.uri}`);
        setPhotoUri(photo.uri);
        router.push('/modal');
      } catch (error) {
        logger.error('takePicture: Failed to take picture', { error });
      }
    } else {
      logger.warn('takePicture: Camera ref is not available.');
    }
  }

  /**
   * Starts video recording on long press.
   */
  async function startVideoRecording(): Promise<void> {
    if (disabled || isRecording || !hasAllPermissions) return;
    
    logger.info('startVideoRecording: Starting video recording...');
    
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        if (video?.uri) {
          logger.info(`startVideoRecording: Video recorded successfully. URI: ${video.uri}`);
          setVideoUri(video.uri);
          router.push('/modal');
        } else {
          logger.warn('startVideoRecording: No video URI returned');
        }
      } catch (error) {
        logger.error('startVideoRecording: Failed to record video', { error });
      } finally {
        setIsRecording(false);
      }
    }
  }

  /**
   * Stops video recording.
   */
  function stopVideoRecording(): void {
    if (!isRecording) return;
    
    logger.info('stopVideoRecording: Stopping video recording...');
    
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  }

  /**
   * Handles shutter button press - always takes photo unless recording.
   */
  function handleShutterPress(): void {
    takePicture();
  }

  /**
   * Handles long press to start video recording.
   */
  function handleShutterLongPress(): void {
    startVideoRecording();
  }

  /**
   * Gets the appropriate shutter icon based on recording state.
   */
  function getShutterIcon(): string {
    if (isRecording) return 'stop';
    return 'camera';
  }

  return (
    <View style={styles.container}>
      {/* Shutter button */}
      <View style={styles.shutterContainer}>
        <IconButton
          icon={getShutterIcon()}
          iconColor={isRecording ? '#ff4444' : '#ffffff'}
          size={60}
          onPress={isRecording ? stopVideoRecording : handleShutterPress}
          onLongPress={handleShutterLongPress}
          disabled={disabled}
          style={[
            styles.shutterButton,
            isRecording && styles.recordingButton,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  shutterContainer: {
    alignItems: 'center',
  },
  shutterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    borderColor: '#ff4444',
  },
}); 