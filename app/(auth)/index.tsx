/**
 * This is the main authentication screen.
 * It provides a unified interface for user login and registration,
 * using react-hook-form for form management and Zod for validation.
 */
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Image, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { TextInput, Button, Text, useTheme, HelperText } from 'react-native-paper';

// Define the shape of the form data for type safety and validation
export type SignUpCredentials = z.infer<typeof validationSchema>;

const validationSchema = z
  .object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    displayName: z.string().min(3, 'Display name must be at least 3 characters.').optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If displayName is present, it must be a string of at least 3 chars.
      // This is for the sign-up case.
      if (data.displayName !== undefined) {
        return typeof data.displayName === 'string' && data.displayName.length >= 3;
      }
      return true;
    },
    {
      message: 'Display name must be at least 3 characters.',
      path: ['displayName'],
    }
  )
  .refine(
    (data) => {
      // If confirmPassword is provided, it must match password.
      // This is for the sign-up case.
      if (data.confirmPassword !== undefined) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { control, handleSubmit, formState: { errors }, setError } = useForm<SignUpCredentials>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    },
  });

  const { signUp, signIn, error: authError } = useAuth();
  const theme = useTheme();

  const onSubmit = async (data: SignUpCredentials) => {
    try {
      if (isSignUp) {
        // The schema ensures the data is valid, including matching passwords
        // and displayName presence. We can assert displayName is not null.
        await signUp({
          email: data.email,
          password: data.password,
          displayName: data.displayName!,
        });
      } else {
        await signIn(data.email, data.password);
      }
    } catch (e) {
      // Auth errors are already handled in the useAuth hook,
      // but we can log any component-specific issues here.
      console.error('An error occurred during form submission:', e);
    }
  };

  const toggleFormType = () => {
    setError('root', {}); // Clear previous auth errors
    setIsSignUp((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text variant="headlineMedium" style={styles.title}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        <View style={styles.formContainer}>
          {isSignUp && (
            <>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Display Name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    error={!!errors.displayName}
                    style={styles.input}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.displayName}>
                {errors.displayName?.message}
              </HelperText>
            </>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email?.message}
          </HelperText>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                error={!!errors.password}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>

          {isSignUp && (
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirm Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  error={!!errors.confirmPassword}
                  style={styles.input}
                />
              )}
            />
          )}
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword?.message}
          </HelperText>

          <HelperText type="error" visible={!!authError}>
            {authError}
          </HelperText>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
        >
          {isSignUp ? 'Sign Up' : 'Login'}
        </Button>

        <Pressable onPress={toggleFormType} style={styles.toggleButton}>
          <Text style={{ color: theme.colors.primary }}>
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 4,
  },
  toggleButton: {
    marginTop: 24,
  },
}); 