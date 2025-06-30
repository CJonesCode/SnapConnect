/**
 * This is the layout for the authentication group of screens.
 * It defines a stack navigator for the login, sign-up, and other auth-related screens.
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
