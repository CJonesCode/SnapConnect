/**
 * This is the main authentication screen.
 * It provides a unified interface for user login and registration,
 * using react-hook-form for form management and Zod for validation.
 */
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';

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
      <ThemedView className="flex-1 justify-center items-center p-6 bg-gray-100 dark:bg-gray-900">
        <ThemedText className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </ThemedText>

        <View className="w-full">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full px-4 py-3 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text className="text-red-500 mb-4">{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full px-4 py-3 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text className="text-red-500 mb-4">{errors.password.message}</Text>}

          {isSignUp && (
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="w-full px-4 py-3 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                />
              )}
            />
          )}
          {errors.confirmPassword && <Text className="text-red-500 mb-4">{errors.confirmPassword.message}</Text>}

          {authError && <Text className="text-red-500 mb-4">{authError}</Text>}
        </View>

        <TouchableOpacity
          className="w-full bg-blue-600 py-3 rounded-lg items-center"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">{isSignUp ? 'Sign Up' : 'Login'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleFormType} className="mt-6">
          <Text className="text-blue-600 dark:text-blue-400">
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
} 