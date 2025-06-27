/**
 * This is the main authentication screen.
 * It provides a unified interface for user login and registration,
 * using react-hook-form for form management and Zod for validation.
 */
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Image, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { TextInput, Button, Text, useTheme, HelperText } from 'react-native-paper';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, isLoading, error: authError, setError } = useAuth();
  const theme = useTheme();

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
          loading={isLoading}
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