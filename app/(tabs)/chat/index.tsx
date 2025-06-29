import { View, Text, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useUserStore } from '../../../hooks/useUserStore';
import { getTipsForUser, markTipAsViewed, Tip } from '../../../services/firebase/tipService';
import { getFriendsSignals, Signal } from '../../../services/firebase/signalService';
import { useFocusEffect, useRouter } from 'expo-router';
import { logger } from '../../../services/logging/logger';

// Unified type for the SectionList
type ChatItem = (Tip & { type: 'tip' }) | (Signal & { type: 'signal' });

export default function ChatScreen() {
  const { user } = useAuth();
  const { profile } = useUserStore();
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    try {
      const friendIds = profile.friends || [];
      const [userTips, friendsSignals] = await Promise.all([
        getTipsForUser(user.uid),
        friendIds.length > 0 ? getFriendsSignals(friendIds) : Promise.resolve([]),
      ]);

      const tipItems: ChatItem[] = userTips.map((t) => ({ ...t, type: 'tip' }));
      const signalItems: ChatItem[] = friendsSignals.map((s) => ({ ...s, type: 'signal' }));

      setSections([
        { title: 'Signals', data: signalItems },
        { title: 'New Tips', data: tipItems },
      ]);

    } catch (error) {
      logger.error('Failed to fetch chat data', { error });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user, profile])
  );

  const handleItemPress = async (item: ChatItem) => {
    if (item.type === 'tip') {
      await markTipAsViewed(item.id);
      fetchData(); // Re-fetch to update the list
    } else {
      router.push('/(tabs)/chat/signal');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleItemPress(item)}>
          <View style={styles.listItem}>
            <Text style={styles.itemText}>
              {item.type === 'tip'
                ? `New Tip from ${item.senderId}`
                : `New Signal from ${item.postedBy}`}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      renderSectionHeader={({ section: { title, data } }) =>
        data.length > 0 ? <Text style={styles.header}>{title}</Text> : null
      }
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text>No new tips or signals.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    marginVertical: 8,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 16,
  },
});