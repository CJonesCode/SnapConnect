/**
 * Profile Screen
 *
 * This screen displays the current user's profile information and provides
 * actions such as signing out. It serves as the main hub for user-specific
 * settings and management.
 */
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Avatar, Button, Text, Divider, useTheme, TextInput, IconButton, Dialog, Portal, HelperText } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { logger } from '@/services/logging/logger';
import { useState } from 'react';
import { updateUserProfile } from '@/services/firebase/userService';

export default function AccountScreen() {
  const { user, signOut, isLoading: isAuthLoading, deleteAccount, error: authError, setError } = useAuth();
  const { profile, fetchProfile } = useUserStore();
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => {
    setDialogVisible(false);
    setPassword('');
    setError(null);
  };

  async function handleSignOut() {
    try {
      await signOut();
      logger.info('User initiated sign-out complete.');
    } catch (error) {
      logger.error('Failed to sign out from profile screen.', { error });
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await deleteAccount(password);
      hideDialog();
    } catch (error) {
      // error is already set in useAuth
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSave() {
    const trimmedDisplayName = displayName.trim();
    if (!user || !profile || !trimmedDisplayName || trimmedDisplayName === profile.displayName) {
      setIsEditing(false);
      // If the name is empty after trimming, revert to the original name
      if (!trimmedDisplayName) {
        setDisplayName(profile?.displayName || '');
      }
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserProfile(user.uid, { displayName: trimmedDisplayName });
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
    <ScrollView 
      contentContainerStyle={[styles.innerContainer, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerSection}>
        {profile?.photoURL ? (
          <Avatar.Image
              size={128}
              source={{ uri: profile.photoURL }}
              style={styles.avatar}
          />
        ) : (
          <Avatar.Icon size={128} icon="account" style={styles.avatar} />
        )}

        {profile && (
          <View style={styles.displayNameContainer}>
            {isEditing ? (
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                dense
                maxLength={24}
                textAlign="center"
              />
            ) : (
              <Text variant="headlineSmall" style={styles.displayName}>{profile.displayName || 'Not set'}</Text>
            )}
            <IconButton
              icon={isEditing ? 'check' : 'pencil'}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isUpdating}
              loading={isUpdating}
              style={styles.editButton}
            />
          </View>
        )}
        {isEditing && (
          <HelperText type="info" visible={isEditing}>
            {`${displayName.length} / 24`}
          </HelperText>
        )}
      </View>

      <Divider style={styles.divider} />

      {profile && (
        <View style={styles.profileSection}>
          <Text variant="labelLarge" style={styles.label}>Username:</Text>
          <Text variant="bodyLarge" style={styles.value}>@{profile.username}</Text>
          <Text variant="labelLarge" style={styles.label}>Email:</Text>
          <Text variant="bodyLarge" style={styles.value}>{profile.email}</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />
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
      <Button
        mode="outlined"
        onPress={showDialog}
        style={[styles.button, { borderColor: colors.error, marginTop: 16 }]}
        textColor={colors.error}
        disabled={isAuthLoading}
      >
        Delete Account
      </Button>
      </View>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>Please enter your password to confirm. This action is irreversible.</Text>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ marginTop: 16 }}
            />
            <HelperText type="error" visible={!!authError}>
              {authError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} disabled={isDeleting}>Cancel</Button>
            <Button onPress={handleDeleteAccount} textColor={colors.error} disabled={isDeleting} loading={isDeleting}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 48,
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  avatar: {
    marginBottom: 16,
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
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  displayName: {
    textAlign: 'center',
  },
  label: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  value: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
    minWidth: '60%',
    height: 48, // To match Text height roughly
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -24 }], // Half of IconButton size (48)
  },
  button: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 4,
  },
  dangerZone: {
    width: '100%',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'grey',
    paddingTop: 10,
  }
}); 