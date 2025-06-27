import "../global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider, useTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logging/logger';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Hide the splash screen now that we have an auth state.
      SplashScreen.hideAsync();
      const targetRoute = user ? '/(tabs)' : '/(auth)';
      logger.info('Auth state resolved, navigating.', { targetRoute });
      router.replace(targetRoute);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    // While determining auth state, show our custom splash screen.
    return <CustomSplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} className={colorScheme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    // Also show the splash screen while fonts are loading.
    return <CustomSplashScreen />;
  }

  return <RootLayoutNav />;
}
