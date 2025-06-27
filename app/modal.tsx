/**
 * This screen is presented modally to preview a captured photo.
 * It receives the photo's URI and displays it, offering options
 * to discard or proceed with the snap.
 */
import { View, Image, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { sendSnap } from '@/services/firebase/snapService';
import { useTheme } from '@/hooks/useTheme';

export default function PhotoPreviewModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { colors } = useTheme();

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
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <Image source={{ uri }} className="flex-1" resizeMode="contain" />

      <View className="absolute top-16 left-5 right-5 flex-row justify-start">
        <TouchableOpacity onPress={handleDiscard}>
          <MaterialIcons name="close" size={40} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-12 left-0 right-0 items-center">
        <TouchableOpacity
          className="flex-row items-center bg-accent dark:bg-dark-accent px-8 py-4 rounded-full"
          onPress={handleSend}
        >
          <Text className="text-lg font-bold text-white">Send</Text>
          <MaterialIcons name="send" size={24} color={'white'} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}
