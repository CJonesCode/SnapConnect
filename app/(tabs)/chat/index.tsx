import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Card, Text, Avatar, useTheme, Divider } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToFriends, UserProfile } from '@/services/firebase/userService';
import { subscribeToStories, Story } from '@/services/firebase/storyService';
import { subscribeToGroups, Group } from '@/services/firebase/groupService';
import { subscribeToSnaps, markSnapAsViewed, Snap } from '@/services/firebase/snapService';

const StoryBar = ({ friends, storiesByUser }: { friends: UserProfile[], storiesByUser: Record<string, Story[]> }) => {
  const router = useRouter();
  // Find friends who have active stories
  const friendsWithStories = friends.filter(friend => (storiesByUser[friend.uid]?.length ?? 0) > 0);

  if (friendsWithStories.length === 0) {
    return null; // Don't render the bar if there are no stories
  }

  const handlePressStory = (userId: string) => {
    const userStories = storiesByUser[userId];
    if (!userStories || userStories.length === 0) return;

    // Navigate to the story viewer screen with the stories for that user
    router.push({
      pathname: './story',
      params: {
        stories: JSON.stringify(userStories),
        friends: JSON.stringify(friends),
      },
    });
  };

  const renderStoryThumbnail = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.storyThumbnail}
      onPress={() => handlePressStory(item.uid)}
    >
      <Avatar.Image size={64} source={{ uri: item.photoURL || `https://i.pravatar.cc/64?u=${item.uid}` }} />
      <Text numberOfLines={1} style={styles.storyName}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.storyBarContainer}>
      <FlatList
        data={friendsWithStories}
        renderItem={renderStoryThumbnail}
        keyExtractor={(item) => item.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );
};

export default function ChatScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [storiesByUser, setStoriesByUser] = useState<Record<string, Story[]>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [snaps, setSnaps] = useState<(Snap & { id: string })[]>([]);

  // 1. Subscribe to friends
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriends(user.uid, setFriends);
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to stories when friends list is available
  useEffect(() => {
    if (friends.length === 0) {
      setStoriesByUser({});
      return;
    }
    const friendIds = friends.map((f) => f.uid);
    const unsubscribe = subscribeToStories(friendIds, setStoriesByUser);
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [friends]);

  // 3. Subscribe to groups
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToGroups(user.uid, setGroups);
    return () => unsubscribe();
  }, [user]);
  
  // 4. Subscribe to snaps
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSnaps(user.uid, setSnaps);
    return () => unsubscribe();
  }, [user]);

  const handleTipPress = (tipId: string) => {
    markSnapAsViewed(tipId);
    // Note: The UI will update automatically via the real-time listener
    // because the `viewed` status change will be detected.
  };

  const renderItem = ({ item }: { item: any }) => {
    // Check if the item is a group
    if (item.members) {
      return (
        <Link href={`./group/${item.id}`} asChild>
          <Card style={styles.card}>
            <Card.Title
              title={item.name}
              titleVariant="titleMedium"
              left={(props) => <Avatar.Icon {...props} icon="account-group" />}
            />
          </Card>
        </Link>
      );
    }
    
    // Otherwise, it's a snap (tip)
    const isViewed = item.viewed; // Directly use the 'viewed' property from the snap
    
    return (
      <Link
        href={{
          pathname: './tip',
          // TODO: This tip screen will need to be updated to handle snap data
          params: { ...item, viewed: item.viewed.toString() },
        }}
        asChild
      >
        <Card style={styles.card} onPress={() => handleTipPress(item.id)}>
          <Card.Title
            title={item.senderDisplayName || 'Someone'}
            subtitle="New Snap"
            titleVariant="titleMedium"
            subtitleNumberOfLines={1}
            left={(props) => <Avatar.Icon {...props} icon={isViewed ? "message-outline" : "message-flash"} />}
            right={(props) => !isViewed && <Avatar.Icon {...props} icon="circle" size={20} color={theme.colors.primary} />}
          />
        </Card>
      </Link>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StoryBar friends={friends} storiesByUser={storiesByUser} />
      <Divider />
      <FlatList
        data={[...groups, ...snaps]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  card: {
    marginVertical: 4,
  },
  storyBarContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  storyThumbnail: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  storyName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
});