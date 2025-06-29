/**
 * User Profile Screen
 *
 * This screen displays another user's profile information and provides
 * the ability to remove them as a friend. It's a read-only view similar
 * to the account screen but for viewing other users.
 */
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Button, Text, Divider, useTheme, Dialog, Portal } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logging/logger';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserProfile, UserProfile, removeFriend } from '@/services/firebase/userService';

export default function UserProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  async function fetchUserProfile() {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      logger.error('Failed to fetch user profile', { error, userId });
    } finally {
      setIsLoading(false);
    }
  }

  const showRemoveDialog = () => setDialogVisible(true);
  const hideRemoveDialog = () => setDialogVisible(false);

  async function handleRemoveFriend() {
    if (!user || !profile) return;
    
    setIsRemoving(true);
    try {
      await removeFriend(user.uid, profile.uid);
      logger.info('Successfully removed friend', { 
        currentUser: user.uid, 
        removedFriend: profile.uid 
      });
      
      hideRemoveDialog();
      router.back();
    } catch (error) {
      logger.error('Failed to remove friend', { error });
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text>User not found</Text>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.innerContainer, { backgroundColor: colors.background }]}
      >
        <View style={styles.headerSection}>
          {profile.photoURL ? (
            <Avatar.Image
              size={128}
              source={{ uri: profile.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={128} icon="account" style={styles.avatar} />
          )}

          <Text variant="headlineSmall" style={styles.displayName}>
            {profile.displayName}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.profileSection}>
          <Text variant="labelLarge" style={styles.label}>Username:</Text>
          <Text variant="bodyLarge" style={styles.value}>@{profile.username}</Text>
        </View>

        <View style={{ flex: 1 }} />
        
        <View style={styles.actionSection}>
          <Button
            mode="outlined"
            onPress={showRemoveDialog}
            style={[styles.button, { borderColor: colors.error }]}
            textColor={colors.error}
            icon="account-minus"
          >
            Remove Friend
          </Button>
        </View>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={hideRemoveDialog}>
            <Dialog.Title>Remove Friend</Dialog.Title>
            <Dialog.Content>
              <Text>
                Are you sure you want to remove {profile.displayName} from your friends list?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                mode="text" 
                onPress={hideRemoveDialog} 
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button 
                mode="contained"
                onPress={handleRemoveFriend} 
                buttonColor={colors.error}
                disabled={isRemoving}
                loading={isRemoving}
              >
                Remove
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  displayName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: '100%',
    marginVertical: 20,
  },
  profileSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
  },
  value: {
    marginBottom: 8,
  },
  actionSection: {
    width: '100%',
    paddingVertical: 20,
  },
  button: {
    marginVertical: 8,
  },
}); 