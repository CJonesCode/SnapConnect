/**
 * This modal screen is presented after a user takes a photo.
 * It displays the photo and a list of friends to send the tip to.
 * It also allows the user to add a stock ticker and a text analysis.
 */
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useCameraStore } from '@/hooks/useCameraStore';
import { createTip, createSignalTip } from '@/services/firebase/tipService';
import { subscribeToFriends, UserProfile } from '@/services/firebase/userService';
import { Button, IconButton, useTheme, List, ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { logger } from '@/services/logging/logger';
import { Video, ResizeMode } from 'expo-av';
import { storage } from '@/services/firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads media file to Firebase Storage for tips
 * @param uri Local file URI
 * @param type Media type (photo or video)
 * @param userId User's UID for organizing storage
 * @returns Promise<string> - Firebase Storage download URL
 */
async function uploadTipMedia(uri: string, type: 'photo' | 'video', userId: string): Promise<string> {
  try {
    logger.info(`Uploading ${type} to Firebase Storage`, { uri });
    
    // Fetch the media file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create storage path: tips/userId/timestamp_type.ext
    const timestamp = Date.now();
    const extension = type === 'photo' ? 'jpg' : 'mp4';
    const filePath = `tips/${userId}/${timestamp}_${type}.${extension}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    logger.info(`Successfully uploaded ${type} to Firebase Storage`, { downloadURL });
    
    return downloadURL;
  } catch (error) {
    logger.error(`Failed to upload ${type} to Firebase Storage`, { error, uri });
    throw new Error(`Failed to upload ${type}. Please try again.`);
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
  const [sendingMode, setSendingMode] = useState<'friends' | 'signal'>('friends');

  // Validate and format ticker input (uppercase letters only, max 5 chars)
  const handleTickerChange = (text: string) => {
    // Remove any non-letter characters and convert to uppercase
    const formattedTicker = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    // Limit to 5 characters (typical stock symbol length)
    const truncatedTicker = formattedTicker.slice(0, 5);
    setTicker(truncatedTicker);
  };

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
    if (!user || !uri || !type) return;
    
    // Validate based on sending mode
    if (sendingMode === 'friends' && selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send to.');
      return;
    }
    if (sendingMode === 'signal' && friends.length === 0) {
      Alert.alert('No Friends', 'You need friends to send a signal to.');
      return;
    }

    setIsSending(true);
    try {
      const mediaUrl = await uploadTipMedia(uri, type, user.uid);
      
      if (sendingMode === 'friends') {
        // Send to selected friends
        const sendPromises = selectedFriends.map((friend) =>
          createTip(user.uid, friend.uid, mediaUrl, { tip, ticker })
        );
        await Promise.all(sendPromises);
        logger.info('Successfully sent tips to selected friends', { count: selectedFriends.length });
      } else {
        // Send as signal to all friends
        const allFriendIds = friends.map(friend => friend.uid);
        await createSignalTip(user.uid, allFriendIds, mediaUrl, { tip, ticker });
        logger.info('Successfully sent signal tip to all friends', { count: allFriendIds.length });
      }
      
      // Reset camera state to clear preview and return to camera
      resetMedia();
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to send tip', { error, sendingMode });
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
      <SafeAreaView style={styles.safeArea}>
        <Text>No photo found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
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

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <View style={styles.inputContainer}>
            <TextInput
              label="Stock Ticker (e.g., AAPL)"
              value={ticker}
              onChangeText={handleTickerChange}
              style={styles.input}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={5}
              placeholder="Enter 1-5 letters"
            />
            <TextInput
              label="Your Tip / Analysis"
              value={tip}
              onChangeText={setTip}
              style={styles.input}
              multiline
              mode="outlined"
              numberOfLines={3}
            />
          </View>

          {/* Sending Mode Selection */}
          <View style={styles.modeContainer}>
            <Text style={styles.modeText}>Send As:</Text>
            <View style={styles.modeButtons}>
              <Button
                mode={sendingMode === 'friends' ? 'contained' : 'outlined'}
                onPress={() => setSendingMode('friends')}
                style={styles.modeButton}
                compact
              >
                To Friends
              </Button>
              <Button
                mode={sendingMode === 'signal' ? 'contained' : 'outlined'}
                onPress={() => setSendingMode('signal')}
                style={styles.modeButton}
                compact
              >
                As Signal
              </Button>
            </View>
          </View>

          {/* Friend Selection (only show in friends mode) */}
          {sendingMode === 'friends' && (
            <>
              <Text style={styles.sendToText}>Select Friends:</Text>
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
                          description={`@${item.username}`}
                          left={(props) => <List.Icon {...props} icon={isSelected ? 'check-circle' : 'circle-outline'} />}
                        />
                      </TouchableOpacity>
                    );
                  }}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                  scrollEnabled={false}
                />
              )}
            </>
          )}

          {/* Signal Mode Info */}
          {sendingMode === 'signal' && (
            <View style={styles.signalInfo}>
              <Text style={styles.signalInfoText}>
                📡 This will be sent as a Signal to all {friends.length} of your friends
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSend}
            style={styles.sendButton}
            disabled={isSending || (sendingMode === 'friends' && selectedFriends.length === 0) || (sendingMode === 'signal' && friends.length === 0)}
            loading={isSending}
          >
            {sendingMode === 'friends' 
              ? `Send to ${selectedFriends.length} Friend${selectedFriends.length !== 1 ? 's' : ''}` 
              : `Send Signal to ${friends.length} Friend${friends.length !== 1 ? 's' : ''}`
            }
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
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
    height: '35%', // Reduced to leave more room for keyboard
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  contentContainer: {
    flexGrow: 1,
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
    marginTop: 16,
    marginBottom: 16,
  },
  modeContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
  },
  signalInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  signalInfoText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});
