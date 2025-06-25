/**
 * This screen is presented modally to preview a captured photo.
 * It receives the photo's URI and displays it, offering options
 * to discard or proceed with the snap.
 */
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { sendSnap } from '@/services/firebase/snapService';

export default function PhotoPreviewModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();

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
    <SafeAreaView style={styles.container}>
      <Image source={{ uri }} style={styles.previewImage} />

      <View style={styles.topControls}>
        <TouchableOpacity onPress={handleDiscard}>
          <MaterialIcons name="close" size={40} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
          <MaterialIcons name="send" size={24} color="black" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  sendButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
