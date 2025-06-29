/**
 * Profile Screen
 *
 * This screen displays the current user's profile information and provides
 * actions such as signing out. It serves as the main hub for user-specific
 * settings and management.
 */
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Divider, useTheme, TextInput, IconButton } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { logger } from '@/services/logging/logger';
import { useState } from 'react';
import { updateUserProfile } from '@/services/firebase/userService';

export default function ProfileScreen() {
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const { profile, fetchProfile } = useUserStore();
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');

  async function handleSignOut() {
    try {
      await signOut();
      logger.info('User initiated sign-out complete.');
    } catch (error) {
      logger.error('Failed to sign out from profile screen.', { error });
    }
  }

  async function handleSave() {
    if (!user || !profile || displayName === profile.displayName) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserProfile(user.uid, { displayName });
      await fetchProfile(user.uid); // Refresh profile data
      logger.info('User profile updated successfully.');
    } catch (error) {
      logger.error('Failed to update profile.', { error });
    } finally {
      setIsEditing(false);
      setIsUpdating(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
    <View style={[styles.innerContainer, { backgroundColor: colors.background }]}>
      <Text variant="headlineLarge" style={styles.title}>
        Profile
      </Text>
      <Divider style={styles.divider} />

      {profile && (
        <View style={styles.profileSection}>
          <View style={styles.displayNameContainer}>
            {isEditing ? (
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                dense
              />
            ) : (
              <Text variant="headlineSmall" style={styles.displayName}>{profile.displayName || 'Not set'}</Text>
            )}
            <IconButton
              icon={isEditing ? 'check' : 'pencil'}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isUpdating}
              loading={isUpdating}
            />
          </View>
          <Text variant="labelLarge" style={styles.label}>Username:</Text>
          <Text variant="bodyLarge" style={styles.value}>@{profile.username}</Text>
          <Text variant="labelLarge" style={styles.label}>Email:</Text>
          <Text variant="bodyLarge" style={styles.value}>{profile.email}</Text>
        </View>
      )}


      <View style={styles.dangerZone}>
      <Button
        mode="contained"
        onPress={handleSignOut}
        buttonColor={colors.error}
        style={styles.button}
        disabled={isUpdating || isAuthLoading}
        loading={isAuthLoading}
      >
        Sign Out
      </Button>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 48,
  },
  title: {
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    marginVertical: 20,
  },
  profileSection: {
    width: '100%',
    marginBottom: 32,
  },
  displayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  displayName: {
    flex: 1,
  },
  label: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  value: {
    marginBottom: 8,
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'transparent'
  },
  button: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 4,
  },
  dangerZone: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'grey',
    paddingTop: 10,
  }
}); 