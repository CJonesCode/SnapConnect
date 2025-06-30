import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  searchUsers,
  UserProfile,
  sendFriendRequest,
  subscribeToFriendRequests,
  Friendship,
  acceptFriendRequest,
  declineFriendRequest,
  subscribeToFriends,
  getUserProfile,
} from '@/services/firebase/userService';
import { showLocalNotification } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { useRouter } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  List,
  useTheme,
  Divider,
  Avatar,
} from 'react-native-paper';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { profile } = useUserStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]); // Track sent requests by UID
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null); // Track which user we're sending request to
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requestSenderProfiles, setRequestSenderProfiles] = useState<Record<string, UserProfile>>({});
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(
    null,
  );
  const theme = useTheme();
  
  // Track previous friend requests to detect new ones for notifications
  const previousRequestsRef = useRef<Friendship[]>([]);
  const isInitialLoadRef = useRef(true);

  // Effect to subscribe to friend requests and detect new ones for notifications
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToFriendRequests(user.uid, async (newRequests) => {
      // Update the state
      setFriendRequests(newRequests);
      
      // Skip notification on initial load
      if (isInitialLoadRef.current) {
        previousRequestsRef.current = newRequests;
        isInitialLoadRef.current = false;
        return;
      }
      
      // Check for truly new requests by comparing with previous requests
      const previousRequestIds = new Set(previousRequestsRef.current.map(req => req.id));
      const newRequestsToNotify = newRequests.filter(req => !previousRequestIds.has(req.id));
      
      // Show notifications for each new request
      for (const request of newRequestsToNotify) {
        try {
          // Get sender profile for the notification
          const senderProfile = await getUserProfile(request.requestedBy);
          const senderName = senderProfile?.displayName || 'Someone';
          
          await showLocalNotification(
            'New Friend Request! 👋',
            `${senderName} sent you a friend request`,
            {
              type: 'friend_request',
              friendshipId: request.id,
              requestedBy: request.requestedBy,
            }
          );
        } catch (error) {
          console.error('Error showing friend request notification:', error);
        }
      }
      
      // Update the previous requests reference
      previousRequestsRef.current = newRequests;
    });
    
    return () => {
      unsubscribe();
      // Reset refs when component unmounts or user changes
      isInitialLoadRef.current = true;
      previousRequestsRef.current = [];
    };
  }, [user]);

  // Effect to subscribe to friends list
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriends(user.uid, setFriends);
    return () => unsubscribe();
  }, [user]);

  // Effect to fetch user profiles for friend request senders
  useEffect(() => {
    const fetchRequestSenderProfiles = async () => {
      const profiles: Record<string, UserProfile> = {};
      
      for (const request of friendRequests) {
        if (!requestSenderProfiles[request.requestedBy]) {
          const profile = await getUserProfile(request.requestedBy);
          if (profile) {
            profiles[request.requestedBy] = profile;
          }
        }
      }
      
      if (Object.keys(profiles).length > 0) {
        setRequestSenderProfiles(prev => ({ ...prev, ...profiles }));
      }
    };

    if (friendRequests.length > 0) {
      fetchRequestSenderProfiles();
    }
  }, [friendRequests, requestSenderProfiles]);

  /**
   * Helper function to check if a user is already a friend
   */
  const isAlreadyFriend = (targetUserId: string): boolean => {
    return friends.some(friend => friend.uid === targetUserId);
  };

  /**
   * Helper function to check if there's a pending request in either direction
   */
  const getPendingRequestStatus = (targetUserId: string): {
    hasPendingRequest: boolean;
    isOutgoing: boolean;
    isIncoming: boolean;
  } => {
    // Check if current user sent request to target user
    const outgoingRequest = friendRequests.find(
      request => request.requestedBy === user?.uid && 
                request.members.includes(targetUserId)
    );
    
    // Check if target user sent request to current user
    const incomingRequest = friendRequests.find(
      request => request.requestedBy === targetUserId && 
                request.members.includes(user?.uid || '')
    );

    return {
      hasPendingRequest: !!(outgoingRequest || incomingRequest),
      isOutgoing: !!outgoingRequest,
      isIncoming: !!incomingRequest,
    };
  };

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
    if (!user) {
      console.error('Could not send friend request: missing current user data.');
      return;
    }

    setSendingRequestTo(recipient.uid);
    try {
      await sendFriendRequest(user.uid, recipient.uid);
      setSentRequests((prev) => [...prev, recipient.uid]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleAcceptRequest = async (request: Friendship) => {
    if (!user) return;
    setIsProcessingRequest(request.id);
    try {
      await acceptFriendRequest(request);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (request: Friendship) => {
    if (!user) return;
    setIsProcessingRequest(request.id);
    try {
      await declineFriendRequest(request);
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const renderFriendItem = ({ item }: { item: UserProfile }) => (
    <List.Item
      title={item.displayName}
      description={`@${item.username}`}
      left={(props) => 
        item.photoURL ? (
          <Avatar.Image 
            {...props} 
            size={40} 
            source={{ uri: item.photoURL }} 
          />
        ) : (
          <Avatar.Icon 
            {...props} 
            size={40} 
            icon="account" 
          />
        )
      }
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => router.push(`/user-profile?userId=${item.uid}`)}
    />
  );

  const renderRequestItem = ({ item }: { item: Friendship }) => {
    const isProcessing = isProcessingRequest === item.id;
    const senderProfile = requestSenderProfiles[item.requestedBy];
    const displayName = senderProfile?.displayName || item.requestedBy;
    
    return (
      <List.Item
        title={displayName}
        description="Sent you a friend request"
        right={() => (
          <View style={styles.requestActions}>
            <Button 
              mode="contained-tonal" 
              onPress={() => handleAcceptRequest(item)}
              disabled={isProcessing}
              loading={isProcessing}
            >
              Accept
            </Button>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={() => handleDeclineRequest(item)}
              disabled={isProcessing}
              loading={isProcessing}
            >
              Decline
            </Button>
          </View>
        )}
      />
    );
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isLocalRequestSent = sentRequests.includes(item.uid);
    const isSendingRequest = sendingRequestTo === item.uid;
    const isExistingFriend = isAlreadyFriend(item.uid);
    const pendingStatus = getPendingRequestStatus(item.uid);

    // Determine button state and text
    let buttonText = 'Add';
    let buttonMode: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal' = 'contained-tonal';
    let isButtonDisabled = isSendingRequest;
    let onPressHandler = () => handleAddFriend(item);

    if (isExistingFriend) {
      buttonText = 'Friends';
      buttonMode = 'outlined';
      isButtonDisabled = true;
      onPressHandler = async () => {}; // No action for existing friends
    } else if (pendingStatus.isOutgoing || isLocalRequestSent) {
      buttonText = 'Sent';
      buttonMode = 'outlined';
      isButtonDisabled = true;
      onPressHandler = async () => {}; // No action for sent requests
    } else if (pendingStatus.isIncoming) {
      buttonText = 'Respond';
      buttonMode = 'contained';
      isButtonDisabled = true;
      onPressHandler = async () => {}; // User should respond in the friend requests section
    }

    return (
      <List.Item
        title={item.displayName}
        description={`@${item.username}`}
        right={() => (
          <Button
            mode={buttonMode}
            onPress={onPressHandler}
            disabled={isButtonDisabled}
            loading={isSendingRequest}
          >
            {buttonText}
          </Button>
        )}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardAvoidingView, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.subHeader}>
          My Friends
        </Text>
        {friends.length > 0 ? (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.uid}
            style={styles.list}
            scrollEnabled={false}
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
              scrollEnabled={false}
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
            loading={isLoading}
            style={styles.searchButton}
          >
            Search
          </Button>
        </View>

        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          style={styles.list}
          scrollEnabled={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
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
    alignItems: 'center',
    gap: 8,
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
  list: {
    width: '100%',
  },
  placeholderText: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
});
