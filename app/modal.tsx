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
import { createTip } from '@/services/firebase/tipService';
import { subscribeToFriends, UserProfile } from '@/services/firebase/userService';
import { Button, IconButton, useTheme, List, ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { logger } from '@/services/logging/logger';

async function uploadMedia(uri: string): Promise<string> {
  // This is a placeholder. In a real app, this would upload to Firebase Storage.
  logger.info('Uploading media from URI (placeholder)', { uri });
  return `https://placehold.co/600x400.png?text=Uploaded:${uri.slice(-10)}`;
}

export default function PhotoPreviewModal() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile: userProfile } = useUserStore();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const theme = useTheme();

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
    }
  }, [user]);

  const handleSend = async () => {
    if (!user || selectedFriends.length === 0 || !uri) return;

    setIsSending(true);
    try {
      const mediaUrl = await uploadMedia(uri);
      const sendPromises = selectedFriends.map((friend) =>
        createTip(user.uid, friend.uid, mediaUrl, { tip, ticker })
      );
      await Promise.all(sendPromises);
      logger.info('Successfully sent tips to selected friends');
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
    return (
      <SafeAreaView style={styles.container}>
        <Text>No photo found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri }} style={styles.previewImage} />
      <IconButton icon="close" size={30} onPress={() => navigation.goBack()} style={styles.closeButton} />

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
  previewImage: {
    width: '100%',
    height: '50%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
