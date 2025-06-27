/**
 * StyledButton Component
 *
 * A standardized, theme-aware button that supports different variants.
 * This ensures all primary and secondary actions are visually consistent.
 *
 * @param variant - 'primary' for standard actions, 'destructive' for dangerous actions.
 */
import { Pressable, PressableProps, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface StyledButtonProps extends PressableProps {
  variant?: 'primary' | 'destructive';
  title: string;
  isLoading?: boolean;
}

export function StyledButton({
  variant = 'primary',
  title,
  isLoading = false,
  ...props
}: StyledButtonProps) {
  const { colors } = useTheme();

  const variantClasses = {
    primary: 'bg-accent dark:bg-dark-accent',
    destructive: 'bg-destructive dark:bg-dark-destructive',
  };

  return (
    <Pressable
      className={`w-full py-3 rounded-lg items-center justify-center shadow ${variantClasses[variant]}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text className="text-white font-bold text-lg">{title}</Text>
      )}
    </Pressable>
  );
} 