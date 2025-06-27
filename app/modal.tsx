/**
 * This screen is presented modally to preview a captured photo.
 * It receives the photo's URI and displays it, offering options
 * to discard or proceed with the snap.
 */
import { View, Image, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { sendSnap } from '@/services/firebase/snapService';
import { Button, IconButton, useTheme } from 'react-native-paper';

export default function PhotoPreviewModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const theme = useTheme();

  if (!uri) {
    // Should not happen if navigation is set up correctly
    return null;
  }

  const handleDiscard = () => {
    router.back();
  };

  const handleSend = async () => {
    if (!user) {
      console.error("No user found, can't send snap.");
      // Optionally, navigate to auth screen or show an error
      return;
    }

    // TODO: Replace this with a friend selection UI
    const recipientId = 'HARDCODED_RECIPIENT_ID';

    try {
      await sendSnap(uri, user.uid, recipientId);
      router.back(); // Go back to the camera after sending
    } catch (error) {
      console.error('Failed to send snap:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />

      <IconButton
        icon="close"
        size={30}
        onPress={handleDiscard}
        style={styles.closeButton}
        iconColor={theme.colors.onBackground}
      />

      <View style={styles.sendButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSend}
          icon="send"
          style={styles.sendButton}
        >
          Send
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sendButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
