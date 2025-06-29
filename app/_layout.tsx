import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logging/logger';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import { AuthGuard } from '@/components/AuthGuard';
import { PaperProvider, useTheme } from 'react-native-paper';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: undefined, // Let AuthGuard handle initial routing
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isInitialized } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (isInitialized) {
      // Hide the splash screen now that we have an auth state.
      SplashScreen.hideAsync();
      logger.info('App: Splash screen hidden');
    }
  }, [isInitialized]);

  if (!isInitialized) {
    // While determining auth state, show our custom splash screen.
    return <CustomSplashScreen />;
  }

  return (
    <PaperProvider>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2c2830', // React Native Paper elevation.level2 color
            },
            headerTitleStyle: {
              color: '#e7e1e5', // React Native Paper onSurface color
            },
            headerTintColor: '#e7e1e5', // React Native Paper onSurface color
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              title: 'Create Tip',
            }} 
          />
          <Stack.Screen 
            name="user-profile" 
            options={{
              title: 'User Profile',
              headerBackTitle: 'Back',
            }} 
          />
          <Stack.Screen 
            name="group-modal" 
            options={{
              title: 'Create Group',
              presentation: 'modal',
            }} 
          />
        </Stack>
      </AuthGuard>
    </PaperProvider>
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
    return (
      <PaperProvider>
        <CustomSplashScreen />
      </PaperProvider>
    );
  }

  return <RootLayoutNav />;
}
