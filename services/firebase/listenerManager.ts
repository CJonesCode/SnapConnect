/**
 * Manages Firestore listeners to ensure proper cleanup on logout
 */

import { logger } from '@/services/logging/logger';

// Store all active listeners
const activeListeners = new Set<() => void>();

/**
 * Registers a listener for cleanup
 */
export function registerListener(unsubscribe: () => void): () => void {
  activeListeners.add(unsubscribe);
  
  // Return a cleanup function that also removes from the set
  return () => {
    unsubscribe();
    activeListeners.delete(unsubscribe);
  };
}

/**
 * Cleans up all active listeners - should be called on logout
 */
export function cleanupAllListeners(): void {
  logger.info(`Cleaning up ${activeListeners.size} active Firestore listeners`);
  
  for (const unsubscribe of activeListeners) {
    try {
      unsubscribe();
    } catch (error) {
      logger.warn('Error cleaning up listener', { error });
    }
  }
  
  activeListeners.clear();
  logger.info('All Firestore listeners cleaned up');
}

/**
 * Gets the count of active listeners (for debugging)
 */
export function getActiveListenerCount(): number {
  return activeListeners.size;
} 