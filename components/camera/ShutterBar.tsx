/**
 * ShutterBar component for camera capture controls.
 * 
 * Provides photo capture on press and video recording on long press,
 * with visual feedback for recording state.
 */
import React, { RefObject } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, SegmentedButtons } from 'react-native-paper';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCameraStore } from '@/hooks/useCameraStore';
import { logger } from '@/services/logging/logger';

interface ShutterBarProps {
  cameraRef: RefObject<CameraView | null>;
  disabled?: boolean;
}

/**
 * ShutterBar renders the capture controls at the bottom of the camera screen.
 *
 * @param {ShutterBarProps} props - Component props
 * @returns The rendered ShutterBar component
 */
export default function ShutterBar({ cameraRef, disabled = false }: ShutterBarProps) {
  const router = useRouter();
  const { 
    mode,
    isRecording, 
    setMode,
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

  /**
   * Handles video recording start/stop when in video mode.
   */
  async function toggleVideoRecording(): Promise<void> {
    if (disabled) return;
    
    if (isRecording) {
      // Stop recording
      logger.info('toggleVideoRecording: Stopping video recording...');
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
    } else {
      // Start recording
      logger.info('toggleVideoRecording: Starting video recording...');
      if (cameraRef.current) {
        setIsRecording(true);
        try {
          const video = await cameraRef.current.recordAsync();
          if (video) {
            logger.info(`toggleVideoRecording: Success. Video URI: ${video.uri}`);
            setVideoUri(video.uri);
            router.push({
              pathname: '/modal',
              params: { uri: video.uri, type: 'video' },
            });
          } else {
            logger.warn('toggleVideoRecording: Recording returned no video object.');
          }
        } catch (error) {
          logger.error('toggleVideoRecording: Failed to record video', { error });
        } finally {
          setIsRecording(false);
        }
      } else {
        logger.warn('toggleVideoRecording: Camera ref is not available.');
      }
    }
  }

  /**
   * Handles starting video recording when the shutter button is long pressed in photo mode.
   */
  async function recordVideo(): Promise<void> {
    if (disabled) return;
    
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

  /**
   * Handles stopping video recording when the press is released.
   */
  function stopVideoRecording(): void {
    logger.info('stopVideoRecording: Press out detected, stopping recording...');
    
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.modeSelector}>
        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as 'photo' | 'video')}
          buttons={[
            { value: 'photo', label: 'Photo' },
            { value: 'video', label: 'Video' },
          ]}
          style={styles.segmentedButtons}
          density="small"
        />
      </View>
      <View style={[
        styles.shutterButtonOuter,
        isRecording && styles.shutterButtonRecording,
      ]}>
        <IconButton
          icon={mode === 'photo' ? 'camera' : (isRecording ? 'stop' : 'video')}
          iconColor="white"
          size={40}
          onPress={mode === 'photo' ? takePicture : toggleVideoRecording}
          onLongPress={mode === 'photo' ? recordVideo : undefined}
          onPressOut={mode === 'photo' ? stopVideoRecording : undefined}
          style={styles.shutterButtonInner}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  segmentedButtons: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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