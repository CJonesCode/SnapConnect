/**
 * Profile Screen
 *
 * This screen displays the current user's profile information and provides
 * actions such as signing out. It serves as the main hub for user-specific
 * settings and management.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { logger } from '@/services/logging/logger';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { profile } = useUserStore();

  async function handleSignOut() {
    try {
      await signOut();
      logger.info('User initiated sign-out complete.');
      // The auth listener will handle navigation automatically.
    } catch (error) {
      logger.error('Failed to sign out from profile screen.', { error });
      // Optionally, show an alert to the user.
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.separator} />

      {profile && (
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Display Name:</Text>
          <Text style={styles.value}>{profile.displayName || 'Not set'}</Text>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  },
  profileInfo: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#666',
  },
  value: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 