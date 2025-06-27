/**
 * StyledTextInput Component
 *
 * This component provides a standardized, theme-aware text input field.
 * It encapsulates the default styling for all input fields across the application,
 * ensuring visual consistency. It accepts all standard TextInput props.
 */
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function StyledTextInput(props: TextInputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      className="w-full h-12 border border-border dark:border-dark-border rounded-lg px-4 text-text dark:text-dark-text bg-input dark:bg-dark-input"
      placeholderTextColor={colors.placeholder}
      {...props}
    />
  );
} 