/**
 * This screen is presented modally to preview a captured photo.
 * It displays the photo and a list of friends to send the snap to.
 */
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { sendSnap } from '@/services/firebase/snapService';
import { subscribeToFriends, UserProfile } from '@/services/firebase/userService';
import { createStory } from '@/services/firebase/storyService';
import { Button, IconButton, useTheme, List, ActivityIndicator, Text } from 'react-native-paper';

export default function PhotoPreviewModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const theme = useTheme();

  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriends(user.uid, (fetchedFriends) => {
      setFriends(fetchedFriends);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (!uri) {
    return null;
  }

  const handleDiscard = () => {
    if (isSending) return;
    router.back();
  };

  const toggleFriendSelection = (uid: string) => {
    setSelectedFriends((currentSelected) =>
      currentSelected.includes(uid)
        ? currentSelected.filter((id) => id !== uid)
        : [...currentSelected, uid]
    );
  };

  const handleSend = async () => {
    if (!user || selectedFriends.length === 0) {
      return;
    }
    setIsSending(true);
    try {
      const sendPromises = selectedFriends.map((recipientId) =>
        sendSnap(uri, user.uid, recipientId)
      );
      await Promise.all(sendPromises);
      router.back(); // Go back to the camera after sending
    } catch (error) {
      console.error('Failed to send one or more snaps:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsSending(false);
    }
  };

  const handlePostStory = async () => {
    if (!user) return;
    setIsPostingStory(true);
    try {
      await createStory(uri, user.uid);
      router.back(); // Go back to camera after posting
    } catch (error) {
      console.error('Failed to post story:', error);
      // Optionally, show an error message
    } finally {
      setIsPostingStory(false);
    }
  };

  const renderFriendItem = ({ item }: { item: UserProfile }) => {
    const isSelected = selectedFriends.includes(item.uid);
    return (
      <TouchableOpacity onPress={() => toggleFriendSelection(item.uid)}>
        <List.Item
          title={item.displayName}
          style={isSelected && { backgroundColor: theme.colors.surfaceVariant }}
          left={(props) => (
            <List.Icon
              {...props}
              icon={isSelected ? 'check-circle' : 'circle-outline'}
            />
          )}
        />
      </TouchableOpacity>
    );
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
        disabled={isSending || isPostingStory}
      />

      <View style={styles.bottomContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.uid}
            ListEmptyComponent={<Text style={styles.emptyText}>You have no friends to send this to.</Text>}
          />
        )}
        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            icon="book-plus-multiple"
            style={styles.actionButton}
            onPress={handlePostStory}
            loading={isPostingStory}
            disabled={isSending || isPostingStory}
          >
            Story
          </Button>
          <Button
            mode="contained"
            onPress={handleSend}
            icon="send"
            style={styles.actionButton}
            disabled={selectedFriends.length === 0 || isSending || isPostingStory}
            loading={isSending}
          >
            {`Send (${selectedFriends.length})`}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 0.6, // Take up 60% of the screen height
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomContainer: {
    flex: 0.4, // Take up remaining 40%
    paddingVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  sendButton: {
    margin: 20,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  }
});
