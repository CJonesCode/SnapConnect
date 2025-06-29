import { Stack, Link } from 'expo-router';
import { Button } from 'react-native-paper';
import React from 'react';

export default function FriendsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Friends',
          headerRight: () => (
            // @ts-ignore - Expo router types may be stale
            <Link href="/group-modal" asChild>
              <Button>New Group</Button>
            </Link>
          ),
        }}
      />
    </Stack>
  );
}
