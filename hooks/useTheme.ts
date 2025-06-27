/**
 * A hook to access the resolved Tailwind theme configuration.
 * This is useful for accessing theme values in components or APIs
 * that don't support utility classes, such as navigator options.
 */
import { useColorScheme } from 'nativewind';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const themeColors = fullConfig.theme.colors as any;
  const colors = colorScheme === 'dark' ? themeColors.dark : themeColors;

  return {
    colors,
    isDarkMode: colorScheme === 'dark',
  };
} 