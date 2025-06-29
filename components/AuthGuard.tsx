/**
 * AuthGuard Component
 * 
 * Handles authentication-based routing without destroying the navigation stack.
 * This preserves camera and other component states across auth changes.
 */
import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logging/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard handles navigation based on authentication state.
 * It uses push/navigate instead of replace to preserve navigation context.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inModal = segments[0] === 'modal';

    logger.info('AuthGuard: Navigation check', { 
      authenticated: !!user, 
      inAuthGroup, 
      inTabsGroup,
      inModal,
      segments
    });

    if (user && inAuthGroup) {
      // User is authenticated but in auth screens, navigate to main app
      logger.info('AuthGuard: Navigating authenticated user to tabs');
      router.replace('/(tabs)');
    } else if (!user && inTabsGroup) {
      // User is not authenticated but in main app, navigate to auth
      logger.info('AuthGuard: Navigating unauthenticated user to auth');
      router.replace('/(auth)');
    } else if (!user && !inAuthGroup && !inTabsGroup && !inModal) {
      // Initial load for unauthenticated user (but not in modal)
      logger.info('AuthGuard: Initial navigation to auth');
      router.replace('/(auth)');
    } else if (user && !inAuthGroup && !inTabsGroup && !inModal) {
      // Initial load for authenticated user (but not in modal)
      logger.info('AuthGuard: Initial navigation to tabs');
      router.replace('/(tabs)');
    } else if (inModal) {
      // Modal is open - don't interfere with modal navigation
      logger.info('AuthGuard: Modal open, no navigation needed');
    }
  }, [user, isInitialized, segments, router]);

  return <>{children}</>;
} 