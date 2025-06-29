/**
 * This modal screen is presented after a user takes a photo.
 * It displays the photo and a list of friends to send the tip to.
 * It also allows the user to add a stock ticker and a text analysis.
 */
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useCameraStore } from '@/hooks/useCameraStore';
import { createTip } from '@/services/firebase/tipService';
import { subscribeToFriends, UserProfile } from '@/services/firebase/userService';
import { Button, IconButton, useTheme, List, ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { logger } from '@/services/logging/logger';
import { Video, ResizeMode } from 'expo-av';

async function uploadMedia(uri: string, type: 'photo' | 'video'): Promise<string> {
  // This is a placeholder. In a real app, this would upload to Firebase Storage.
  logger.info(`Uploading ${type} from URI (placeholder)`, { uri });
  if (type === 'photo') {
    return `https://placehold.co/600x400.png?text=Uploaded:${uri.slice(-10)}`;
  } else {
    return `https://placehold.co/600x400.png?text=Video:${uri.slice(-10)}`;
  }
}

export default function PhotoPreviewModal() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile: userProfile } = useUserStore();
  const { resetMedia, photoUri, videoUri } = useCameraStore();
  const theme = useTheme();
  
  // Use camera store as primary source, fallback to route params
  const uri = photoUri || videoUri;
  const type = photoUri ? 'photo' : 'video';

  // Debug logging
  logger.info('PhotoPreviewModal: Opened with', { 
    storePhotoUri: photoUri, 
    storeVideoUri: videoUri, 
    finalUri: uri, 
    finalType: type 
  });

  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [tip, setTip] = useState('');
  const [ticker, setTicker] = useState('');

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToFriends(user.uid, (fetchedFriends) => {
        setFriends(fetchedFriends);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleSend = async () => {
    if (!user || selectedFriends.length === 0 || !uri || !type) return;

    setIsSending(true);
    try {
      const mediaUrl = await uploadMedia(uri, type);
      const sendPromises = selectedFriends.map((friend) =>
        createTip(user.uid, friend.uid, mediaUrl, { tip, ticker })
      );
      await Promise.all(sendPromises);
      logger.info('Successfully sent tips to selected friends');
      // Reset camera state to clear preview and return to camera
      resetMedia();
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to send tips', { error });
      Alert.alert('Error', 'Could not send your tip. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleFriendSelection = (friend: UserProfile) => {
    setSelectedFriends((currentSelected) =>
      currentSelected.some((f) => f.uid === friend.uid)
        ? currentSelected.filter((f) => f.uid !== friend.uid)
        : [...currentSelected, friend]
    );
  };

  if (!uri) {
    logger.warn('PhotoPreviewModal: No URI provided, closing modal');
    return (
      <SafeAreaView style={styles.container}>
        <Text>No photo found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={() => {
            resetMedia();
            navigation.goBack();
          }} 
          style={styles.closeButton} 
        />
      </View>

      {/* Media content */}
      {type === 'video' ? (
        <Video
          source={{ uri }}
          style={styles.previewImage}
          useNativeControls={true}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={true}
          shouldPlay={true}
          isMuted={false}
          onLoad={() => logger.info('Video loaded in modal')}
          onError={(error) => logger.error('Video error in modal', { error })}
        />
      ) : (
        <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            label="Stock Ticker (e.g., AAPL)"
            value={ticker}
            onChangeText={setTicker}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Your Tip / Analysis"
            value={tip}
            onChangeText={setTip}
            style={styles.input}
            multiline
            mode="outlined"
          />
        </View>

        <Text style={styles.sendToText}>Send To:</Text>
        {isLoading ? (
          <ActivityIndicator animating={true} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => {
              const isSelected = selectedFriends.some((f) => f.uid === item.uid);
              return (
                <TouchableOpacity onPress={() => toggleFriendSelection(item)}>
                  <List.Item
                    title={item.displayName}
                    description={item.uid}
                    left={(props) => <List.Icon {...props} icon={isSelected ? 'check-circle' : 'circle-outline'} />}
                  />
                </TouchableOpacity>
              );
            }}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )}
      </View>

      <Button
        mode="contained"
        onPress={handleSend}
        style={styles.sendButton}
        disabled={isSending || selectedFriends.length === 0}
        loading={isSending}
      >
        Send Tip
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '45%', // Reduced slightly to account for header
    backgroundColor: 'black',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    paddingVertical: 10,
  },
  input: {
    marginBottom: 10,
  },
  sendToText: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    margin: 16,
  },
});
