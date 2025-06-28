import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  searchUsers,
  UserProfile,
  sendFriendRequest,
  subscribeToFriendRequests,
  FriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  subscribeToFriends,
} from '@/services/firebase/userService';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  List,
  useTheme,
  Divider,
} from 'react-native-paper';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { profile } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]); // Track sent requests by UID
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);
  const theme = useTheme();

  // Effect to subscribe to friend requests
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriendRequests(user.uid, setFriendRequests);
    return () => unsubscribe();
  }, [user]);

  // Effect to subscribe to friends list
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriends(user.uid, setFriends);
    return () => unsubscribe();
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((u) => u.uid !== user?.uid));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (recipient: UserProfile) => {
    if (!user || !profile?.displayName) {
      // TODO: Show a user-friendly error
      console.error('Could not send friend request: missing current user data.');
      return;
    }

    try {
      await sendFriendRequest(user.uid, profile.displayName, recipient.uid);
      setSentRequests((prev) => [...prev, recipient.uid]);
      // Optional: Add a toast notification for success
    } catch (error) {
      console.error('Error sending friend request:', error);
      // Optional: Add a toast notification for failure
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    setIsProcessingRequest(request.id);
    try {
      await acceptFriendRequest(user.uid, request);
      // The real-time listener will automatically update the UI.
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      // Optional: show error toast
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    if (!user) return;
    setIsProcessingRequest(request.id);
    try {
      await declineFriendRequest(user.uid, request);
      // The real-time listener will automatically update the UI.
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      // Optional: show error toast
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const renderFriendItem = ({ item }: { item: UserProfile }) => (
    <List.Item
      title={item.displayName}
      left={(props) => <List.Icon {...props} icon="account-heart" />}
    />
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <List.Item
      title={item.fromDisplayName}
      description="Sent you a friend request"
      right={() => (
        <View style={styles.requestActions}>
          {isProcessingRequest === item.id ? (
            <ActivityIndicator style={{ marginRight: 20 }} />
          ) : (
            <>
              <Button mode="text" onPress={() => handleAcceptRequest(item)}>
                Accept
              </Button>
              <Button
                mode="text"
                textColor={theme.colors.error}
                onPress={() => handleDeclineRequest(item)}
              >
                Decline
              </Button>
            </>
          )}
        </View>
      )}
    />
  );

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isRequestSent = sentRequests.includes(item.uid);

    return (
      <List.Item
        title={item.displayName}
        description={`UID: ${item.uid}`} // Temporary for debugging
        right={() => (
          <Button
            mode="contained-tonal"
            onPress={() => handleAddFriend(item)}
            disabled={isRequestSent}
          >
            {isRequestSent ? 'Sent' : 'Add'}
          </Button>
        )}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.subHeader}>My Friends</Text>
      {friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.uid}
          style={styles.list}
        />
      ) : (
        <Text style={styles.placeholderText}>Your friends list is empty.</Text>
      )}
      <Divider style={styles.divider} />

      {friendRequests.length > 0 && (
        <>
          <Text variant="headlineSmall" style={styles.subHeader}>
            Friend Requests
          </Text>
          <FlatList
            data={friendRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
          <Divider style={styles.divider} />
        </>
      )}
      <Text variant="headlineLarge" style={styles.title}>
        Find Friends
      </Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button
          mode="contained"
          onPress={handleSearch}
          disabled={isLoading}
          style={styles.searchButton}
        >
          Search
        </Button>
      </View>

      {isLoading && <ActivityIndicator size="large" style={styles.loader} />}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  requestActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  searchButton: {
    height: 54, // Match TextInput height
    justifyContent: 'center',
  },
  loader: {
    marginVertical: 16,
  },
  list: {
    width: '100%',
  },
  placeholderText: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
}); 