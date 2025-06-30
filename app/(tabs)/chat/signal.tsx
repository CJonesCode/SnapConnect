/**
 * This screen displays a user's stories in a full-screen, auto-advancing viewer.
 */
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { useUserStore } from '../../../hooks/useUserStore';
import { getFriendsSignals, Signal } from '../../../services/firebase/signalService';
import { logger } from '../../../services/logging/logger';

/**
 * SignalViewerScreen displays a list of active signals from the user's friends.
 * It fetches the current user's friend list and then retrieves all
 * non-expired signals posted by those friends.
 */
export default function SignalViewerScreen() {
  const { user: authUser } = useAuth();
  const { profile } = useUserStore();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      if (authUser && profile?.friends && profile.friends.length > 0) {
        try {
          // The friends array just contains UIDs
          const friendIds = profile.friends;
          const fetchedSignals = await getFriendsSignals(friendIds);
          setSignals(fetchedSignals);
        } catch (err) {
          logger.error('Failed to fetch signals for viewer', { error: err });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, [authUser, profile]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Loading signals...</Text>
      </View>
    );
  }

  if (signals.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No active signals from your friends.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={signals}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.signalItem}>
          <Image source={{ uri: item.mediaUrl }} style={styles.image} />
          {/* Future: Could display author's name here by matching `postedBy` with a friend's profile */}
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  listContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
  },
  signalItem: {
    marginBottom: 20,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: 350,
    height: 600,
    resizeMode: 'cover',
  },
}); 