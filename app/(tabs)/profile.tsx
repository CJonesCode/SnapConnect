/**
 * Profile Screen
 *
 * This screen displays the current user's profile information and provides
 * actions such as signing out. It serves as the main hub for user-specific
 * settings and management.
 */
import { Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { logger } from '@/services/logging/logger';
import { StyledButton } from '@/components/primitives/StyledButton';
import { StyledText } from '@/components/primitives/StyledText';
import { Separator } from '@/components/primitives/Separator';

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
    <View className="flex-1 items-center justify-start p-5 pt-12 bg-background dark:bg-dark-background">
      <Text className="text-2xl font-bold mb-5 text-text dark:text-dark-text">Profile</Text>
      <Separator />

      {profile && (
        <View className="w-full mb-8">
          <StyledText variant="muted" className="text-base font-bold mt-2">Display Name:</StyledText>
          <StyledText className="text-lg mb-2">{profile.displayName || 'Not set'}</StyledText>
          <StyledText variant="muted" className="text-base font-bold mt-2">Email:</StyledText>
          <StyledText className="text-lg mb-2">{profile.email}</StyledText>
        </View>
      )}

      <StyledButton
        variant="destructive"
        title="Sign Out"
        onPress={handleSignOut}
      />
    </View>
  );
} 