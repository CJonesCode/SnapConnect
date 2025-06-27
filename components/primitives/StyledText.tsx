/**
 * StyledText Component
 *
 * A standardized, theme-aware text component that supports different variants.
 *
 * @param variant - 'default' for standard text, 'muted' for less prominent text.
 */
import { Text, TextProps } from 'react-native';

interface StyledTextProps extends TextProps {
  variant?: 'default' | 'muted';
}

export function StyledText({
  variant = 'default',
  className,
  ...props
}: StyledTextProps) {
  const variantClasses = {
    default: 'text-text dark:text-dark-text',
    muted: 'text-text dark:text-dark-text opacity-60',
  };

  return (
    <Text
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
} 