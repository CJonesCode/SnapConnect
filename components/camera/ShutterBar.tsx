/**
 * ShutterBar component for camera capture controls.
 * 
 * Simple gesture-based interface:
 * - Tap: Take photo
 * - Long press: Record video
 * - Tap while recording: Stop recording
 */
import React, { RefObject, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCameraStore } from '@/hooks/useCameraStore';
import { logger } from '@/services/logging/logger';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Recording configuration
const RECORDING_TIMEOUT = 30; // seconds

interface ShutterBarProps {
  cameraRef: RefObject<CameraView | null>;
  disabled?: boolean;
  hasAllPermissions?: boolean;
  cameraReady?: boolean;
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
  hasAllPermissions = true,
  cameraReady = true
}: ShutterBarProps) {
  const router = useRouter();
  const { 
    isRecording, 
    setIsRecording, 
    setPhotoUri, 
    setVideoUri,
    videoUri
  } = useCameraStore();

  // Recording timer state
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<any>(null);
  
  // Progress ring animation
  const progress = useSharedValue(0);
  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  /**
   * Plays shutter sound for photo capture
   */
  async function playShutterSound(): Promise<void> {
    try {
      // Camera shutter sound is automatically played by expo-camera
      // We don't need to add our own sound
      logger.info('Photo captured - shutter sound automatically played');
    } catch (error) {
      logger.warn('Could not play shutter sound', { error });
    }
  }

  /**
   * Plays recording start sound
   */
  async function playRecordingStartSound(): Promise<void> {
    try {
      // TODO: Implement tone generation when needed
      // Options:
      // 1. Use native system sounds (iOS: AudioServicesPlaySystemSound, Android: ToneGenerator)
      // 2. Use react-native-tone-generator library
      // 3. Add sound files to assets/sounds/
      logger.info('Recording started - pleasant tone would play here');
    } catch (error) {
      logger.warn('Could not play recording start sound', { error });
    }
  }

  /**
   * Cleans up recording state variables and ensures UI is in correct state.
   */
  function cleanupRecording(): void {
    logger.info('cleanupRecording: Resetting recording state');
    setIsRecording(false);
    setRecordingTime(0);
    // Cancel and reset progress animation
    cancelAnimation(progress);
    progress.value = 0;
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  }

  /**
   * useEffect hook calls cleanupRecording whenever a new videoUri is set,
   * ensuring the UI state is correct after a recording is finished.
   */
  useEffect(() => {
    if (videoUri) {
      cleanupRecording();
    }
  }, [videoUri]);

  /**
   * Cleanup intervals on unmount
   */
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

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
        playShutterSound(); // Play shutter sound
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
  function startVideoRecording(): void {
    if (disabled || isRecording || !hasAllPermissions || !cameraReady) {
      logger.warn('startVideoRecording: Blocked', { 
        disabled, 
        isRecording, 
        hasAllPermissions, 
        cameraReady 
      });
      return;
    }
    
    logger.info('startVideoRecording: Starting video recording...');
    
    if (!cameraRef.current) {
      logger.error('startVideoRecording: Camera ref is null!');
      Alert.alert('Camera Error', 'Camera is not ready. Please try again.');
      return;
    }

    try {
      // Start recording with platform-specific quality settings
      logger.info('startVideoRecording: Calling recordAsync...');
      const videoRecordPromise = cameraRef.current.recordAsync({
        maxDuration: RECORDING_TIMEOUT,
      });
      
      logger.info('startVideoRecording: recordAsync called, setting state...');
      setIsRecording(true);
      setRecordingTime(0);
      
      // Play recording start sound
      playRecordingStartSound();
      
      // Start progress animation (draining effect)
      progress.value = withTiming(1, { duration: RECORDING_TIMEOUT * 1000 });
      logger.info(`startVideoRecording: Progress animation started for ${RECORDING_TIMEOUT} seconds`);
      
      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
      // Handle recording completion with .then() and .catch()
      logger.info('startVideoRecording: Setting up promise handlers...');
      videoRecordPromise
        .then((video) => {
          logger.info('startVideoRecording: Promise resolved!', { video });
          if (video?.uri) {
            logger.info(`startVideoRecording: Video recorded successfully. URI: ${video.uri}`);
            setVideoUri(video.uri);
            router.push('/modal');
          } else {
            logger.warn('startVideoRecording: No video URI returned');
          }
          cleanupRecording();
        })
        .catch((error) => {
          logger.error('startVideoRecording: Promise rejected!', { error });
          Alert.alert('Recording Error', 'Failed to record video. Please try again.');
          cleanupRecording();
        });
        
      logger.info('startVideoRecording: Setup complete');
    } catch (error) {
      logger.error('startVideoRecording: Synchronous error!', { error });
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      cleanupRecording();
    }
  }

  /**
   * Stops video recording.
   */
  function stopVideoRecording(): void {
    if (!isRecording) {
      logger.warn('stopVideoRecording: Not currently recording');
      return;
    }
    
    logger.info('stopVideoRecording: Stopping video recording...');
    
    if (!cameraRef.current) {
      logger.error('stopVideoRecording: Camera ref is null!');
      cleanupRecording();
      return;
    }

    try {
      logger.info('stopVideoRecording: Calling stopRecording...');
      cameraRef.current.stopRecording();
      logger.info('stopVideoRecording: stopRecording called successfully');
      // Note: isRecording will be set to false via cleanupRecording 
      // when the recordAsync promise resolves in the .then() handler
    } catch (error) {
      logger.error('stopVideoRecording: Error calling stopRecording', { error });
      cleanupRecording();
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

  /**
   * Animated props for reverse countdown progress ring
   * Shows REMAINING time (full → empty)
   */
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * progress.value, // Countdown: 0=full, 1=empty
  }));

  /**
   * Renders the circular progress indicator around the button
   */
  function renderProgressIndicator() {
    if (!isRecording) return null;

    return (
      <View style={styles.progressContainer}>
        <Svg width={size} height={size} style={styles.progressSvg}>
          {/* Background circle (what shows when countdown is complete) */}
          <Circle
            stroke="rgba(255, 255, 255, 0.3)"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Reverse countdown ring (starts full red, drains counterclockwise from 12 o'clock to show remaining time) */}
          <AnimatedCircle
            animatedProps={animatedProps}
            stroke="#ff4444"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeLinecap="round"
            rotation={90}
            origin={`${size / 2}, ${size / 2}`}
            scaleX={-1}
          />
        </Svg>
      </View>
    );
  }

  /**
   * Formats recording time as MM:SS
   */
  function formatRecordingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <View style={styles.container}>
      {/* Recording timer display */}
      {isRecording && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {formatRecordingTime(recordingTime)}
          </Text>
        </View>
      )}
      
      {/* Shutter button with progress indicator */}
      <View style={styles.shutterContainer}>
        {renderProgressIndicator()}
        <IconButton
          icon={getShutterIcon()}
          iconColor={isRecording ? '#ff4444' : '#ffffff'}
          size={48}
          onPress={isRecording ? stopVideoRecording : handleShutterPress}
          onLongPress={handleShutterLongPress}
          disabled={disabled}
          style={styles.iconOnlyButton}
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  timerText: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
    width: 80,
    height: 80,
  },
  progressContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // Allow button touches through
  },
  progressSvg: {
    position: 'absolute',
  },
  iconOnlyButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    margin: 0,
    width: 80,
    height: 80,
  },
}); 