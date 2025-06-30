import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { subscribeToFriends, UserProfile, getUserProfile } from '../../../services/firebase/userService';
import { getTipsForUser, markTipAsViewed, Tip } from '../../../services/firebase/tipService';
import { useRouter } from 'expo-router';
import { logger } from '../../../services/logging/logger';
import { 
  Text, 
  Card, 
  Avatar, 
  Chip, 
  ActivityIndicator, 
  useTheme,
  Surface,
  IconButton
} from 'react-native-paper';

// Enhanced tip with sender profile info
type TipWithSender = Tip & {
  senderProfile?: UserProfile;
};

export default function SignalsScreen() {
  const { user } = useAuth();
  const [tips, setTips] = useState<TipWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, UserProfile>>({});
  const router = useRouter();
  const theme = useTheme();

  // Fetch tips for the user
  const fetchTips = async (showRefreshing = false) => {
    if (!user) return;
    
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const userTips = await getTipsForUser(user.uid);
      
      // Fetch sender profiles for tips we don't have yet
      const newSenderIds = userTips
        .map(tip => tip.senderId)
        .filter(senderId => !senderProfiles[senderId]);
      
      const newProfiles: Record<string, UserProfile> = {};
      for (const senderId of newSenderIds) {
        try {
          const profile = await getUserProfile(senderId);
          if (profile) {
            newProfiles[senderId] = profile;
          }
        } catch (error) {
          logger.error('Error fetching sender profile', { senderId, error });
        }
      }
      
      // Update sender profiles if we got new ones
      if (Object.keys(newProfiles).length > 0) {
        setSenderProfiles(prev => ({ ...prev, ...newProfiles }));
      }
      
      // Add sender profile info to tips
      const tipsWithSenders = userTips.map(tip => ({
        ...tip,
        senderProfile: senderProfiles[tip.senderId] || newProfiles[tip.senderId]
      }));
      
      setTips(tipsWithSenders);
      logger.info(`Fetched ${userTips.length} tips for user`);
    } catch (error) {
      logger.error('Failed to fetch tips', { error });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch tips on component mount and when user changes
  useEffect(() => {
    fetchTips();
  }, [user]);

  // Handle tip press - navigate to tip viewer and mark as viewed
  const handleTipPress = async (tip: TipWithSender) => {
    try {
      // Mark as viewed
      await markTipAsViewed(tip.id);
      
      // Navigate to tip viewer with tip data
      router.push({
        pathname: '/(tabs)/chat/tip',
        params: {
          id: tip.id,
          mediaUrl: tip.mediaUrl,
          ticker: tip.ticker || '',
          tip: tip.tip || '',
          from: tip.senderProfile?.username || tip.senderId,
          viewed: 'true'
        }
      });
      
      // Refresh tips to remove viewed one
      fetchTips(true);
    } catch (error) {
      logger.error('Error handling tip press', { error, tipId: tip.id });
    }
  };

  // Handle pull to refresh
  const onRefresh = () => {
    fetchTips(true);
  };

  // Render individual tip card
  const renderTipCard = ({ item: tip }: { item: TipWithSender }) => {
    const senderName = tip.senderProfile?.displayName || 'Unknown';
    const senderUsername = tip.senderProfile?.username || tip.senderId;
    const isSignal = tip.isSignal || false;

    return (
      <Card style={styles.tipCard} onPress={() => handleTipPress(tip)}>
        <Card.Content>
          {/* Header with sender info and signal indicator */}
          <View style={styles.tipHeader}>
            <View style={styles.senderInfo}>
              {tip.senderProfile?.photoURL ? (
                <Avatar.Image 
                  size={36} 
                  source={{ uri: tip.senderProfile.photoURL }} 
                />
              ) : (
                <Avatar.Icon size={36} icon="account" />
              )}
              <View style={styles.senderText}>
                <Text variant="titleSmall">{senderName}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  @{senderUsername}
                </Text>
              </View>
            </View>
            {isSignal && (
              <Chip icon="rss" compact>Signal</Chip>
            )}
          </View>

          {/* Media preview and content */}
          <View style={styles.tipContent}>
            <Image 
              source={{ uri: tip.mediaUrl }} 
              style={styles.mediaPreview}
              resizeMode="cover"
            />
            <View style={styles.tipMeta}>
              {tip.ticker && (
                <Text variant="titleMedium" style={styles.ticker}>
                  ${tip.ticker}
                </Text>
              )}
              {tip.tip && (
                <Text 
                  variant="bodyMedium" 
                  numberOfLines={2}
                  style={styles.tipText}
                >
                  {tip.tip}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && tips.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading your signals...
        </Text>
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <FlatList
        data={tips}
        renderItem={renderTipCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Tips Yet
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Your friends' tips and signals will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  tipCard: {
    marginBottom: 16,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderText: {
    marginLeft: 12,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  tipMeta: {
    flex: 1,
  },
  ticker: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    lineHeight: 20,
  },
});