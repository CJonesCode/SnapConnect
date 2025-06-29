/**
 * PreviewScreen component for post-capture media review.
 * 
 * Displays captured photos and videos with options to retake or proceed.
 * This component is shown after a user captures media from the camera.
 */
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useCameraStore } from '@/hooks/useCameraStore';

/**
 * PreviewScreen renders the captured photo or video with action buttons.
 *
 * @returns The rendered PreviewScreen component
 */
export default function PreviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { 
    photoUri, 
    videoUri, 
    resetMedia 
  } = useCameraStore();

  const mediaUri = photoUri || videoUri;
  const mediaType = photoUri ? 'photo' : 'video';

  /**
   * Handles retaking the media by clearing the current capture and returning to camera.
   */
  function handleRetake(): void {
    resetMedia();
  }

  /**
   * Handles proceeding with the captured media to the tip creation flow.
   */
  function handleProceed(): void {
    if (mediaUri) {
      router.push({
        pathname: '/modal',
        params: { uri: mediaUri, type: mediaType },
      });
    }
  }

  if (!mediaUri) {
    return <View style={styles.container} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.mediaContainer}>
        {mediaType === 'video' ? (
          <Video
            source={{ uri: mediaUri }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : (
          <Image 
            source={{ uri: mediaUri }} 
            style={styles.media} 
            resizeMode="contain" 
          />
        )}
      </View>

      <IconButton
        icon="close"
        iconColor="white"
        size={30}
        onPress={handleRetake}
        style={styles.closeButton}
      />

      <View style={styles.actionBar}>
        <Button
          mode="outlined"
          onPress={handleRetake}
          style={styles.actionButton}
          textColor="white"
        >
          Retake
        </Button>
        <Button
          mode="contained"
          onPress={handleProceed}
          style={styles.actionButton}
        >
          Use {mediaType}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
  },
}); 