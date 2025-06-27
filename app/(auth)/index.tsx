/**
 * This is the main authentication screen.
 * It provides a unified interface for user login and registration,
 * using react-hook-form for form management and Zod for validation.
 */
import { useState } from 'react';
import { View, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { StyledTextInput } from '@/components/primitives/StyledTextInput';
import { StyledButton } from '@/components/primitives/StyledButton';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, isLoading, error: authError, setError } = useAuth();

  // Unified Zod schema
  const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().optional(),
  }).refine(data => {
    if (!isSignUp) return true; // Skip validation if not signing up
    return data.password === data.confirmPassword;
  }, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

  type FormData = z.infer<typeof formSchema>;

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
      } else {
        await signIn(data.email, data.password);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFormType = () => {
    setError(null); // Clear previous auth errors
    setIsSignUp(prev => !prev);
    reset();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center p-6 bg-background dark:bg-dark-background">
        <Image
          source={require('../../assets/images/logo.png')}
          className="w-32 h-32 mb-6"
          style={{ resizeMode: 'contain' }}
        />
        <Text className="text-3xl font-bold mb-8 text-text dark:text-dark-text">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        <View className="w-full">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                placeholder="Email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text className="text-destructive dark:text-dark-destructive mb-4">{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                placeholder="Password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text className="text-destructive dark:text-dark-destructive mb-4">{errors.password.message}</Text>}

          {isSignUp && (
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  placeholder="Confirm Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                />
              )}
            />
          )}
          {errors.confirmPassword && <Text className="text-destructive dark:text-dark-destructive mb-4">{errors.confirmPassword.message}</Text>}

          {authError && <Text className="text-destructive dark:text-dark-destructive mb-4">{authError}</Text>}
        </View>

        <StyledButton
          title={isSignUp ? 'Sign Up' : 'Login'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />

        <TouchableOpacity onPress={toggleFormType} className="mt-6">
          <Text className="text-accent dark:text-dark-accent">
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
} 