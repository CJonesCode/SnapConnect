import { useColorScheme as useDeviceColorScheme } from 'react-native';

/**
 * A hook to determine the color scheme.
 *
 * To re-enable automatic theme detection based on system settings,
 * change this function to:
 * `export function useColorScheme() { return useDeviceColorScheme() }`
 *
 * For now, it is locked to 'dark' as the light theme is not yet implemented.
 */
export function useColorScheme() {
  return 'dark';
} 