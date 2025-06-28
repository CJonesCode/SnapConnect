/**
 * Profile Screen
 *
 * This screen displays the current user's profile information and provides
 * actions such as signing out. It serves as the main hub for user-specific
 * settings and management.
 */
import { View, StyleSheet } from 'react-native';
import { Button, Text, Divider, useTheme } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { logger } from '@/services/logging/logger';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { profile } = useUserStore();
  const { colors } = useTheme();

  async function handleSignOut() {
    try {
      await signOut();
      logger.info('User initiated sign-out complete.');
    } catch (error) {
      logger.error('Failed to sign out from profile screen.', { error });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineLarge" style={styles.title}>
        Profile
      </Text>
      <Divider style={styles.divider} />

      {profile && (
        <View style={styles.profileSection}>
          <Text variant="labelLarge" style={styles.label}>Display Name:</Text>
          <Text variant="bodyLarge" style={styles.value}>{profile.displayName || 'Not set'}</Text>
          <Text variant="labelLarge" style={styles.label}>Email:</Text>
          <Text variant="bodyLarge" style={styles.value}>{profile.email}</Text>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSignOut}
        buttonColor={colors.error}
        style={styles.button}
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  label: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  value: {
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
}); 