import React from 'react';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5 bg-background dark:bg-dark-background">
        <Text className="text-xl font-bold text-text dark:text-dark-text">This screen doesn't exist.</Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-tint dark:text-dark-tint">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
