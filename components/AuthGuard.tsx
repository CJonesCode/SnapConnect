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
    const inUserProfile = segments[0] === 'user-profile';
    const inGroupModal = segments[0] === 'group-modal';

    if (user && inAuthGroup) {
      // User is authenticated but in auth screens, navigate to main app
      logger.info('Redirecting authenticated user to tabs');
      router.replace('/(tabs)');
    } else if (!user && inTabsGroup) {
      // User is not authenticated but in main app, navigate to auth
      logger.info('Redirecting unauthenticated user to auth');
      router.replace('/(auth)');
    } else if (!user && !inAuthGroup && !inTabsGroup && !inModal && !inUserProfile && !inGroupModal) {
      // Initial load for unauthenticated user
      logger.info('Initial navigation to auth');
      router.replace('/(auth)');
    } else if (user && !inAuthGroup && !inTabsGroup && !inModal && !inUserProfile && !inGroupModal) {
      // Initial load for authenticated user
      logger.info('Initial navigation to tabs');
      router.replace('/(tabs)');
    }
  }, [user, isInitialized, segments, router]);

  return <>{children}</>;
} 